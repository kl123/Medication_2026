<template>
  <div class="auth-container">
    <div class="auth-card">
      <!-- 顶部 Logo 和标题 -->
      <div class="auth-header">
        <div class="logo">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4Z" fill="#4A90E2"/>
            <path d="M24 16C20.6863 16 18 18.6863 18 22C18 25.3137 20.6863 28 24 28C27.3137 28 30 25.3137 30 22C30 18.6863 27.3137 16 24 16Z" fill="white"/>
            <path d="M32 22C32 26.4183 28.4183 30 24 30C19.5817 30 16 26.4183 16 22C16 17.5817 19.5817 14 24 14C28.4183 14 32 17.5817 32 22Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h2 class="greeting">hi~</h2>
        <p class="subtitle">我是智慧医疗助手小智</p>
      </div>

      <!-- 表单区域 -->
      <div class="auth-form">
        <div v-if="isRegisterMode" class="form-section">
          <h3 class="form-title">注册</h3>
          <div class="form-group">
            <label class="form-label">账户昵称</label>
            <input
              type="text"
              v-model="registerForm.nickname"
              placeholder="请输入昵称"
              class="form-input"
            />
            <p class="form-tip">昵称只接受_&*三种特殊字符</p>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">电子邮件</label>
              <input
                type="email"
                v-model="registerForm.email"
                placeholder="请输入电子邮件"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label class="form-label">电话</label>
              <input
                type="tel"
                v-model="registerForm.phone"
                placeholder="请输入您的电话号码"
                class="form-input"
              />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">密码</label>
            <div class="password-input">
              <input
                :type="showPassword ? 'text' : 'password'"
                v-model="registerForm.password"
                placeholder="请输入密码"
                class="form-input"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="password-toggle"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path v-if="showPassword" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>
                  <path v-else d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.06M2 2l20 20M6.36 6.36a9.09 9.09 0 0 0-1.55 1.55M14 14c-1.65 1.65-4.35 1.65-6 0"/>
                </svg>
              </button>
            </div>
          </div>
          <button @click="handleRegister" class="btn-primary">继续</button>
          <div class="auth-switch">
            <span>已经有账户了？</span>
            <a href="#" @click="switchToLogin" class="switch-link">登录</a>
          </div>
        </div>

        <div v-else class="form-section">
          <h3 class="form-title">登录</h3>
          <div class="form-group">
            <label class="form-label">电子邮件</label>
            <input
              type="email"
              v-model="loginForm.email"
              placeholder="请输入电子邮件"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label class="form-label">密码</label>
            <div class="password-input">
              <input
                :type="showPassword ? 'text' : 'password'"
                v-model="loginForm.password"
                placeholder="请输入密码"
                class="form-input"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="password-toggle"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path v-if="showPassword" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>
                  <path v-else d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.06M2 2l20 20M6.36 6.36a9.09 9.09 0 0 0-1.55 1.55M14 14c-1.65 1.65-4.35 1.65-6 0"/>
                </svg>
              </button>
            </div>
          </div>
          <button @click="handleLogin" class="btn-primary">登录</button>
          <div class="auth-switch">
            <a href="#" @click="handleForgotPassword" class="switch-link">忘记密码？</a>
            <a href="#" @click="switchToRegister" class="switch-link">注册</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

// 状态管理
const isRegisterMode = ref(false)
const showPassword = ref(false)

const loginForm = reactive({
  email: '',
  password: ''
})

const registerForm = reactive({
  nickname: '',
  email: '',
  phone: '',
  password: ''
})

// 切换模式
const switchToLogin = () => {
  isRegisterMode.value = false
}

const switchToRegister = () => {
  isRegisterMode.value = true
}

// 处理登录
const handleLogin = () => {
  console.log('登录信息:', loginForm)
  // 这里可以添加登录逻辑，如调用API
}

// 处理注册
const handleRegister = () => {
  console.log('注册信息:', registerForm)
  // 这里可以添加注册逻辑，如调用API
}

// 忘记密码
const handleForgotPassword = () => {
  console.log('忘记密码')
  // 这里可以添加忘记密码逻辑
}
</script>

<style scoped>
/* 全局容器 */
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  padding: 1rem;
}

/* 卡片样式 */
.auth-card {
  width: 100%;
  max-width: 480px;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 2.5rem;
}

/* 头部样式 */
.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo {
  margin-bottom: 1rem;
}

.greeting {
  font-size: 1.5rem;
  font-weight: 500;
  color: #333;
  margin: 0 0 0.5rem 0;
}

.subtitle {
  font-size: 1.125rem;
  color: #666;
  margin: 0;
}

/* 表单样式 */
.auth-form {
  width: 100%;
}

.form-title {
  font-size: 1.25rem;
  font-weight: 500;
  color: #4A90E2;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.form-row .form-group {
  flex: 1;
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  color: #4A90E2;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem 0;
  border: none;
  border-bottom: 1px solid #e0e0e0;
  font-size: 1rem;
  color: #333;
  transition: border-color 0.3s;
}

.form-input:focus {
  outline: none;
  border-bottom-color: #4A90E2;
}

.form-tip {
  font-size: 0.75rem;
  color: #e74c3c;
  margin-top: 0.25rem;
}

.password-input {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 0.25rem;
}

.password-toggle:hover {
  color: #4A90E2;
}

/* 按钮样式 */
.btn-primary {
  width: 100%;
  padding: 0.875rem;
  background-color: #4A90E2;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-top: 1rem;
}

.btn-primary:hover {
  background-color: #357abd;
}

/* 切换链接 */
.auth-switch {
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.875rem;
  color: #666;
}

.switch-link {
  color: #4A90E2;
  text-decoration: none;
  margin-left: 0.5rem;
  cursor: pointer;
}

.switch-link:hover {
  text-decoration: underline;
}

/* 响应式适配 */
@media (max-width: 640px) {
  .auth-card {
    padding: 1.5rem;
  }

  .form-row {
    flex-direction: column;
    gap: 1.25rem;
  }
}
</style>