<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { login } from '../api/authService'

const router = useRouter()
const userStore = useUserStore()

const username = ref('')
const password = ref('')
const captcha = ref('')
const showPassword = ref(false)
const captchaImage = ref('')
const captchaUuid = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

// 获取验证码图片
const fetchCaptcha = async () => {
  try {
    const response = await fetch('http://192.168.5.150:8080/retail-admin/captchaImage')
    const data = await response.json()
    if (data.code === 200) {
      captchaImage.value = `data:image/png;base64,${data.data.img}`
      captchaUuid.value = data.data.uuid
    } else {
      errorMessage.value = '获取验证码失败'
    }
  } catch (error) {
    errorMessage.value = '无法连接验证码服务'
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
    errorMessage.value = '请输入用户名'
    return
  }
  
  if (!password.value.trim()) {
    errorMessage.value = '请输入密码'
    return
  }
  
  if (!captcha.value.trim()) {
    errorMessage.value = '请输入验证码'
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
    errorMessage.value = '网络错误，请稍后重试'
    refreshCaptcha()
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <h1>幸运大转盘</h1>
      <div class="login-form">
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            id="username"
            v-model="username"
            type="text"
            placeholder="请输入您的用户名"
            @keyup.enter="handleLogin"
            :disabled="isLoading"
          >
        </div>
        
        <div class="form-group">
          <label for="password">密码</label>
          <div class="password-input">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="请输入密码"
              @keyup.enter="handleLogin"
              :disabled="isLoading"
            >
            <button 
              class="toggle-password"
              @click="showPassword = !showPassword"
              type="button"
            >
              {{ showPassword ? '隐藏' : '显示' }}
            </button>
          </div>
        </div>
        
        <div class="form-group">
          <label>验证码</label>
          <div class="captcha-container">
            <input
              v-model="captcha"
              type="text"
              placeholder="请输入验证码"
              @keyup.enter="handleLogin"
              :disabled="isLoading"
              class="captcha-input"
            >
            <img 
              :src="captchaImage" 
              alt="验证码" 
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
          <span v-if="isLoading">登录中...</span>
          <span v-else>登录</span>
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
  font-size: 0.8rem;
  padding: 5px;
  border-radius: 4px;
}

.toggle-password:hover {
  background-color: rgba(230, 126, 34, 0.1);
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