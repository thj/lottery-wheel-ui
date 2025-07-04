import { createI18n } from 'vue-i18n'
import en from './en'
import zh from './zh'

// 获取浏览器语言设置
const getBrowserLanguage = () => {
  const language = navigator.language.toLowerCase()
  return language.startsWith('zh') ? 'zh' : 'en'
}

// 从本地存储获取语言设置，如果没有则使用浏览器语言
const getStoredLanguage = () => {
  const storedLanguage = localStorage.getItem('language')
  return storedLanguage || getBrowserLanguage()
}

// 创建 i18n 实例
const i18n = createI18n({
  legacy: false, // 使用组合式 API
  locale: getStoredLanguage(),
  fallbackLocale: 'en', // 回退语言
  messages: {
    en,
    zh
  }
})

// 导出切换语言的函数
export const setLanguage = (lang: string) => {
  i18n.global.locale.value = lang
  localStorage.setItem('language', lang)
}

export default i18n