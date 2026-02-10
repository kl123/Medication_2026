import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

// 创建 axios 实例
const request = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器（核心修改：token 放入 header 的 Authorization 中）
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      // 初始化 headers（防止 headers 为 undefined）
      if (!config.headers) {
        config.headers = {}
      }
      // 标准格式：Bearer + 空格 + token（后端通常按此格式解析）
      config.headers.Authorization = token
    }
    // 移除原有的 params 传 token 逻辑（避免冗余）
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器（无修改，保留原有逻辑）
request.interceptors.response.use(
  (response) => {
    const { data, status } = response
    if (status >= 200 && status < 300) {
      return data
    } else {
      ElMessage.error('请求失败：' + response.statusText)
      return Promise.reject(new Error(response.statusText))
    }
  },
  (error) => {
    const { response } = error
    if (response) {
      switch (response.status) {
        case 401:
          ElMessage.error('登录已过期，请重新登录')
          localStorage.removeItem('token')
          router.push('/login')
          break
        case 403:
          ElMessage.error('权限不足')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          router.push('/404')
          break
        default:
          ElMessage.error('请求失败：' + (response.data?.message || response.statusText))
      }
    } else {
      ElMessage.error('网络连接失败，请检查网络')
    }
    return Promise.reject(error)
  }
)

export default request