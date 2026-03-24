import { createRouter, createWebHistory } from 'vue-router'


// 组件导入
const Login = () => import('@/view/Login.vue')

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login, name: '登录' },
  { path: '/test', component: () => import('@/view/test.vue'), name: '测试' },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router