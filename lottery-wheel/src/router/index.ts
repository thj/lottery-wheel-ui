import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import LoginView from '../views/LoginView.vue'
import LotteryView from '../views/LotteryView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/lottery'
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresGuest: true }
    },
    {
      path: '/lottery',
      name: 'lottery',
      component: LotteryView,
      meta: { requiresAuth: true }
    }
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  // 需要登录的页面
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login')
    return
  }
  
  // 已登录用户不能访问的页面（如登录页）
  if (to.meta.requiresGuest && userStore.isLoggedIn) {
    next('/lottery')
    return
  }
  
  next()
})

export default router