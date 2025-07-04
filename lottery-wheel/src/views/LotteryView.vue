<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import LotteryWheel from '../components/LotteryWheel.vue'
import { getPrizes } from '../api/prizeService'
import axios from 'axios'
import { useI18n } from 'vue-i18n'
import { setLanguage } from '../i18n'

const router = useRouter()
const userStore = useUserStore()
const { t } = useI18n()

// 切换语言
const toggleLanguage = () => {
  const currentLocale = localStorage.getItem('language') || 'zh'
  const newLocale = currentLocale === 'zh' ? 'en' : 'zh'
  setLanguage(newLocale)
}

// 抽奖相关状态
const isSpinning = ref(false)
const result = ref('')
const showResult = ref(false)
const prizes = ref<string[]>([])
const prizeObjects = ref<any[]>([]) // 存储完整的奖品对象
const loading = ref(false)
const error = ref<string | null>(null)
const isWinner = ref(false)

// 邀请码相关状态
const showInviteCodeModal = ref(false)
const inviteCode = ref('')
const inviteCodeError = ref<string | null>(null)
const isSubmitting = ref(false) // 添加邀请码提交状态

// 获取奖品列表
onMounted(async () => {
  try {
    loading.value = true
    const prizeData = await getPrizes()
    prizeObjects.value = prizeData // 存储完整的奖品对象
    
    // 尝试使用国际化翻译API返回的奖品名称
    prizes.value = prizeData.map(item => {
      // 尝试使用 prizes.api.{id} 作为翻译键
      const translationKey = `prizes.api.${item.id}`
      // 检查是否有对应的翻译，如果没有则使用原始名称
      return t(translationKey) !== translationKey ? t(translationKey) : item.name
    })
    
    // 检查是否已包含"谢谢参与"，如果没有则添加到列表开头
    const thankYouText = t('lottery.thankYou')
    if (!prizes.value.includes(thankYouText)) {
      prizes.value.unshift(thankYouText)
      // 同时在prizeObjects中添加"谢谢参与"对象
      prizeObjects.value.unshift({ id: 0, name: thankYouText })
    }
  } catch (err) {
    console.error(t('lottery.fetchPrizesFailed'), err)
    if (err.message === t('errors.notLoggedIn')) {
      error.value = t('errors.loginRequired')
      // 清空奖品列表
      prizes.value = []
      // 可以在这里添加跳转到登录页的逻辑
      // router.push('/login')
    } else {
      error.value = t('errors.fetchPrizesFailed')
      // 使用默认奖品作为后备
      prizes.value = [
        t('prizes.first'), t('prizes.second'), t('prizes.third'), t('prizes.fourth'), 
        t('prizes.fifth'), t('prizes.sixth'), t('prizes.seventh'), t('prizes.eighth')
      ]
      
      // 同样检查默认列表是否已包含"谢谢参与"
      const thankYouText = t('lottery.thankYou')
      if (!prizes.value.includes(thankYouText)) {
        prizes.value.unshift(thankYouText)
      }
    }
  } finally {
    loading.value = false
  }
})

// 处理登出
const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}

// 显示邀请码输入弹窗
const startSpin = () => {
  if (isSpinning.value) return
  
  // 重置邀请码和错误信息
  inviteCode.value = ''
  inviteCodeError.value = null
  
  // 显示邀请码输入弹窗
  showInviteCodeModal.value = true
}

// 确认邀请码并开始抽奖
const confirmInviteCode = async () => {
  // 简单验证邀请码是否为空
  if (!inviteCode.value.trim()) {
    inviteCodeError.value = t('errors.emptyInviteCode')
    return
  }
  
  // 设置提交状态为加载中
  isSubmitting.value = true
  
  try {
    // 关闭邀请码输入弹窗
    showInviteCodeModal.value = false
    
    // 重置结果状态
    showResult.value = false
    result.value = ''
    
    // 发送请求到后端接口
    const response = await axios.post(
      `http://192.168.5.150:8080/retail-admin/system/draw/${inviteCode.value.trim()}`, 
      {}, 
      {
        headers: {
          'Authorization': 'Bearer ' + userStore.token
        }
      }
    )
    
    // 检查响应状态
    if (response.data && response.data.code === 200) {
      // 如果后端返回了抽奖结果，使用后端返回的结果
      if (response.data.data.isWinner) {
        isWinner.value = true
        const winPrizeId = response.data.data.prizeVo.id
        
        // 在prizeObjects中查找匹配ID的奖品
        const matchedPrize = prizeObjects.value.find(prize => prize.id === winPrizeId)
        
        if (matchedPrize) {
          // 如果找到匹配的奖品，使用其名称
          result.value = matchedPrize.name
        } else {
          // 如果没有找到匹配的奖品，使用接口返回的名称
          result.value = response.data.data.prizeVo.name
        }
      } else {
        // 如果后端没有返回具体奖品，使用默认逻辑
        isWinner.value = false
        result.value = t('lottery.thankYou')
      }
      
      // 开始抽奖动画
      isSpinning.value = true
    } else {
      // 如果请求失败，显示错误信息
      const errorMsg = response.data?.msg || t('errors.tryAgainLater')
      console.error(t('errors.drawRequestFailed'), errorMsg)
      result.value = t('errors.drawFailedWithReason', { reason: errorMsg })
      isWinner.value = false
      // 显示结果弹窗，提示用户错误信息
      showResult.value = true
    }
  } catch (error) {
    // 处理请求异常
    console.error(t('errors.drawRequestException'), error)
    result.value = t('errors.drawFailed')
    isWinner.value = false
    // 显示结果弹窗，提示用户错误信息
    showResult.value = true
  } finally {
    // 无论成功还是失败，都将提交状态设置为false
    isSubmitting.value = false
  }
}

// 抽奖结束
const onSpinEnd = (prize: string) => {
  isSpinning.value = false
  
  // 如果result.value为空，使用传入的prize参数
  if (!result.value) {
    result.value = prize
  }
  
  showResult.value = true
  
  // 保存抽奖历史（可以扩展为存储到localStorage或发送到服务器）
  const history = JSON.parse(localStorage.getItem('lotteryHistory') || '[]')
  history.push({
    prize: result.value, // 使用result.value而不是prize
    timestamp: new Date().toISOString(),
    username: userStore.username
  })
  localStorage.setItem('lotteryHistory', JSON.stringify(history))
}
</script>

<template>
  <div class="lottery-container">
    <div class="language-switcher">
      <button @click="toggleLanguage" class="language-button">
        {{ t('common.switchLanguage') }}
      </button>
    </div>
    
    <header class="lottery-header">
      <h1>{{ t('lottery.title') }}</h1>
      <div class="user-info">
        <span>{{ t('lottery.welcome') }}, {{ userStore.username }}</span>
        <button class="logout-button" @click="handleLogout">{{ t('lottery.logout') }}</button>
      </div>
    </header>
    
    <main class="lottery-main">
      <div class="wheel-container">
        <template v-if="loading">
          <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>{{ t('lottery.loading') }}</p>
          </div>
        </template>
        <template v-else-if="error">
          <div class="error-message">
            <p>{{ error }}</p>
            <button class="retry-button" @click="onMounted">{{ t('common.retry') }}</button>
          </div>
        </template>
        <template v-else>
          <LotteryWheel 
            :prizes="prizes" 
            :isSpinning="isSpinning" 
            :presetResult="result"
            @spin-end="onSpinEnd" 
          />
        </template>
      </div>
      
      <div class="controls">
        <button 
          class="spin-button" 
          @click="startSpin" 
          :disabled="isSpinning || loading || prizes.length === 0"
        >
          {{ isSpinning ? t('lottery.spinning') : (loading ? t('lottery.loading') : t('lottery.startSpin')) }}
        </button>
      </div>
      
      <div class="result-modal" v-if="showResult" @click.self="showResult = false">
        <div class="modal-content">
          <h2>{{ isWinner ? t('lottery.congratulations') : '' }}</h2>
          <div class="prize-name">{{ result }}</div>
          <button class="close-button" @click="showResult = false">{{ t('common.confirm') }}</button>
        </div>
      </div>
      
      <!-- 邀请码输入弹窗 -->
      <div class="invite-code-modal" v-if="showInviteCodeModal" @click.self="showInviteCodeModal = false">
        <div class="modal-content">
          <h2>{{ t('lottery.enterInviteCode') }}</h2>
          <div class="input-group">
            <input 
              v-model="inviteCode" 
              type="text" 
              :placeholder="t('lottery.inviteCodePlaceholder')"
              @keyup.enter="confirmInviteCode"
              class="invite-code-input"
            />
            <p v-if="inviteCodeError" class="error-text">{{ inviteCodeError }}</p>
          </div>
          <div class="button-group">
            <button class="cancel-button" @click="showInviteCodeModal = false" :disabled="isSubmitting">
              {{ t('common.cancel') }}
            </button>
            <button class="confirm-button" @click="confirmInviteCode" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              {{ isSubmitting ? t('common.submitting') : t('common.confirm') }}
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.lottery-container {
  display: flex;
  flex-direction: column;
  position: relative;
}

.language-switcher {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10;
}

.language-button {
  background: rgba(230, 126, 34, 0.8);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.language-button:hover {
  background: rgba(230, 126, 34, 1);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(230, 126, 34, 0.3);
}

.lottery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-top: 60px;
}

.lottery-header h1 {
  color: #e67e22;
  margin: 0;
  font-size: 1.8rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-info span {
  font-weight: 500;
}

.logout-button {
  background-color: transparent;
  border: 1px solid #e67e22;
  color: #e67e22;
  padding: 8px 15px;
  border-radius: 5px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.logout-button:hover {
  background-color: #e67e22;
  color: white;
}

.lottery-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 20px;
}

.wheel-container {
  width: 100%;
  max-width: 500px;
  margin-bottom: 30px;
}

.controls {
  margin-top: 20px;
  width: 100%;
  max-width: 300px;
  display: flex;
  justify-content: center;
}

.spin-button {
  background: linear-gradient(to right, #e67e22, #f39c12);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 50px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  box-shadow: 0 4px 15px rgba(230, 126, 34, 0.3);
}

.spin-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(230, 126, 34, 0.4);
}

.spin-button:disabled {
  background: linear-gradient(to right, #bdc3c7, #95a5a6);
  cursor: not-allowed;
}

.result-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

.modal-content {
  background: white;
  padding: 30px 50px;
  border-radius: 15px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
  text-align: center;
  max-width: 400px;
  width: 90%;
  animation: slideUp 0.4s ease-out;
}

.modal-content h2 {
  color: #333;
  margin-bottom: 20px;
  font-size: 1.8rem;
}

.prize-name {
  font-size: 2.2rem;
  font-weight: 700;
  color: #e67e22;
  margin: 20px 0;
  animation: pulse 1s infinite alternate;
}

.close-button {
  background-color: #e67e22;
  color: white;
  border: none;
  padding: 10px 30px;
  border-radius: 50px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 20px;
}

.close-button:hover {
  background-color: #d35400;
  transform: translateY(-2px);
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(50px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  from { transform: scale(1); }
  to { transform: scale(1.05); }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  gap: 20px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(230, 126, 34, 0.2);
  border-radius: 50%;
  border-top-color: #e67e22;
  animation: spin 1s linear infinite;
}

.error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #e74c3c;
  font-size: 1.2rem;
  gap: 20px;
}

.retry-button {
  padding: 10px 20px;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 50px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-button:hover {
  background-color: #c0392b;
  transform: translateY(-2px);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 按钮加载指示器样式 */
.spinner-border {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 0.15em solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
  margin-right: 0.5rem;
  vertical-align: text-bottom;
}

.spinner-border-sm {
  width: 1rem;
  height: 1rem;
  border-width: 0.1em;
}

/* 邀请码输入弹窗样式 */
.invite-code-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

.invite-code-input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  margin-bottom: 10px;
  transition: border-color 0.3s;
}

.invite-code-input:focus {
  border-color: #e67e22;
  outline: none;
  box-shadow: 0 0 0 2px rgba(230, 126, 34, 0.2);
}

.error-text {
  color: #e74c3c;
  font-size: 14px;
  margin-top: 5px;
  margin-bottom: 15px;
}

.input-group {
  margin-bottom: 20px;
  width: 100%;
}

.button-group {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  width: 100%;
}

.cancel-button {
  flex: 1;
  background-color: #ecf0f1;
  color: #7f8c8d;
  border: none;
  padding: 10px 0;
  border-radius: 50px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-button:hover {
  background-color: #bdc3c7;
  color: #2c3e50;
}

.confirm-button {
  flex: 1;
  background-color: #e67e22;
  color: white;
  border: none;
  padding: 10px 0;
  border-radius: 50px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.confirm-button:hover {
  background-color: #d35400;
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .lottery-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .wheel-container {
    max-width: 350px;
  }
  
  .spin-button {
    padding: 12px 25px;
    font-size: 16px;
  }
  
  .result-card {
    padding: 20px;
  }
  
  .prize-name {
    font-size: 1.8rem;
  }
}
</style>