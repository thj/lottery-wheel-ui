<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { login } from '../api/authService'
import { useI18n } from 'vue-i18n'
import { setLanguage } from '../i18n'

const router = useRouter()
const userStore = useUserStore()
const { t } = useI18n()

const username = ref('')
const password = ref('')
const captcha = ref('')
const showPassword = ref(false)
const captchaImage = ref('')
const captchaUuid = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

// 切换语言
const toggleLanguage = () => {
  const currentLocale = localStorage.getItem('language') || 'zh'
  const newLocale = currentLocale === 'zh' ? 'en' : 'zh'
  setLanguage(newLocale)
}

  // 获取验证码图片
  const fetchCaptcha = async () => {
    try {
      const response = await fetch('http://192.168.5.150:8080/retail-admin/captchaImage')
      const data = await response.json()
      if (data.code === 200) {
        captchaImage.value = `data:image/png;base64,${data.data.img}`
        captchaUuid.value = data.data.uuid
      } else {
        errorMessage.value = t('login.captchaFailed')
      }
    } catch (error) {
      errorMessage.value = t('login.captchaServiceError')
    }
  }

// 刷新验证码
const refreshCaptcha = () => {
  fetchCaptcha()
}

onMounted(() => {
  fetchCaptcha()
})

const handleLogin = async () => {
  // 清除之前的错误信息
  errorMessage.value = ''
  
  // 验证表单
  if (!username.value.trim()) {
    errorMessage.value = t('login.usernameRequired')
    return
  }
  
  if (!password.value.trim()) {
    errorMessage.value = t('login.passwordRequired')
    return
  }
  
  if (!captcha.value.trim()) {
    errorMessage.value = t('login.captchaRequired')
    return
  }
  
  try {
    isLoading.value = true
    
    // 调用authService进行登录获取token
    const token = await login(username.value, password.value, captcha.value, captchaUuid.value)
    // 调用userStore登录方法，传递用户名和token
    await userStore.login(username.value, token)
    // 跳转到抽奖页面
    router.push('/lottery')
  } catch (error) {
    errorMessage.value = t('login.networkError')
    refreshCaptcha()
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <div class="language-switcher">
      <button @click="toggleLanguage" class="language-button">
        {{ t('common.switchLanguage') }}
      </button>
    </div>
    <div class="login-card">
      <h1>{{ t('login.title') }}</h1>
      <div class="login-form">
        <div class="form-group">
          <label for="username">{{ t('login.username') }}</label>
          <input
            id="username"
            v-model="username"
            type="text"
            :placeholder="t('login.usernameRequired')"
            @keyup.enter="handleLogin"
            :disabled="isLoading"
          >
        </div>
        
        <div class="form-group">
          <label for="password">{{ t('login.password') }}</label>
          <div class="password-input">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              :placeholder="t('login.passwordRequired')"
              @keyup.enter="handleLogin"
              :disabled="isLoading"
            >
            <button 
              class="toggle-password"
              @click="showPassword = !showPassword"
              type="button"
              aria-label="Toggle password visibility"
            >
              <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
                <line x1="3" y1="3" x2="21" y2="21"></line>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="form-group">
          <label>{{ t('login.captcha') }}</label>
          <div class="captcha-container">
            <input
              v-model="captcha"
              type="text"
              :placeholder="t('login.captchaPlaceholder')"
              @keyup.enter="handleLogin"
              :disabled="isLoading"
              class="captcha-input"
            >
            <img 
              :src="captchaImage" 
              :alt="t('login.captchaImage')" 
              class="captcha-image" 
              @click="refreshCaptcha"
              v-if="captchaImage"
            >
          </div>
        </div>
        
        <div class="error-message" v-if="errorMessage">
          {{ errorMessage }}
        </div>
        
        <button 
          class="login-button" 
          @click="handleLogin"
          :disabled="isLoading"
        >
          <span v-if="isLoading">{{ t('common.loading') }}</span>
          <span v-else>{{ t('login.submit') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
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

.login-card {
  background: rgba(255, 255, 255, 0.95);
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

h1 {
  margin-bottom: 30px;
  color: #e67e22;
  font-size: 2.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  text-align: left;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #666;
  font-weight: 500;
}

input {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #ddd;
  border-radius: 10px;
  font-size: 16px;
  transition: all 0.3s ease;
  background: white;
}

input:focus {
  outline: none;
  border-color: #e67e22;
  box-shadow: 0 0 0 3px rgba(230, 126, 34, 0.2);
}

.password-input {
  position: relative;
}

.toggle-password {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #e67e22;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
}

.toggle-password:hover {
  background-color: rgba(230, 126, 34, 0.1);
}

.eye-icon {
  color: #e67e22;
  transition: all 0.2s ease;
}

.toggle-password:hover .eye-icon {
  transform: scale(1.1);
}

.captcha-container {
  display: flex;
  gap: 10px;
}

.captcha-input {
  flex: 1;
}

.captcha-image {
  width: 100px;
  height: 40px;
  cursor: pointer;
  border-radius: 4px;
  border: 1px solid #ddd;
  object-fit: cover;
  transition: all 0.3s ease;
}

.captcha-image:hover {
  opacity: 0.8;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.error-message {
  color: #e74c3c;
  font-size: 0.9rem;
  margin-top: -10px;
  text-align: left;
  animation: shake 0.5s ease-in-out;
}

.login-button {
  background: linear-gradient(to right, #e67e22, #f39c12);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  margin-top: 10px;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(230, 126, 34, 0.4);
  background: linear-gradient(to right, #d35400, #e67e22);
}

.login-button:disabled {
  background: linear-gradient(to right, #bdc3c7, #95a5a6);
  cursor: not-allowed;
  transform: none;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

@media (max-width: 480px) {
  .login-card {
    padding: 30px 20px;
  }
  
  h1 {
    font-size: 2rem;
  }
  
  input {
    padding: 10px 12px;
    font-size: 14px;
  }
  
  .login-button {
    padding: 10px 16px;
    font-size: 14px;
  }
}
</style>