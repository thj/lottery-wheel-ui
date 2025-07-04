import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

// 安装 Pinia
app.use(pinia)

// 安装 Vue Router
app.use(router)

// 安装 i18n
app.use(i18n)

// 挂载应用
app.mount('#app')