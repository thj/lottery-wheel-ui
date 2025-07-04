import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  // 状态
  const isLoggedIn = ref(false)
  const username = ref('')
  const token = ref('')

  // 从 localStorage 恢复用户状态
  const initializeFromStorage = () => {
    const storedUsername = localStorage.getItem('username')
    const storedToken = localStorage.getItem('token')
    if (storedUsername) {
      username.value = storedUsername
      token.value = storedToken || ''
      isLoggedIn.value = true
    }
  }

  // 初始化时恢复状态
  initializeFromStorage()

  // 登录操作
  const login = async (name: string, authToken?: string) => {
    return new Promise<void>((resolve) => {
      username.value = name
      token.value = authToken || ''
      isLoggedIn.value = true
      // 保存到 localStorage
      localStorage.setItem('username', name)
      if (authToken) {
        localStorage.setItem('token', authToken)
      }
      resolve()
    })
  }

  // 登出操作
  const logout = () => {
    username.value = ''
    token.value = ''
    isLoggedIn.value = false
    // 清除 localStorage
    localStorage.removeItem('username')
    localStorage.removeItem('token')
  }

  return {
    isLoggedIn,
    username,
    token,
    login,
    logout
  }
})