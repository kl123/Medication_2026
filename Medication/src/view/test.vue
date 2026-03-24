<template>
  <div class="app">
    <div class="content">
      <h1>欢迎使用 Qsage 模型</h1>
      <p>点击模型会有交互效果哦~</p>
      <div class="button-group">
        <button @click="changeModelScale">调整模型大小</button>
        <button @click="resetModelScale">重置大小</button>
        <button @click="playRandomMotion">播放随机动作</button>
      </div>
      <div class="status" v-if="modelStatus">
        {{ modelStatus }}
      </div>
      <div class="debug-info" v-if="debugInfo">
        <details>
          <summary>调试信息</summary>
          <pre>{{ debugInfo }}</pre>
        </details>
      </div>
    </div>
    
    <div class="live2d-container" ref="containerRef">
      <canvas ref="canvasRef"></canvas>
      <div v-if="loading" class="loading-tip">
        <div class="spinner"></div>
        <p>模型加载中...</p>
      </div>
      <div v-if="error" class="error-tip">
        {{ error }}
        <button @click="reloadModel" class="retry-btn">重试</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as PIXI from 'pixi.js'
// 使用 Cubism 4 版本的导入
import { Live2DModel } from 'pixi-live2d-display/cubism4'

// 挂载 Pixi 到全局
window.PIXI = PIXI

// 响应式数据
const containerRef = ref(null)
const canvasRef = ref(null)
const loading = ref(true)
const error = ref('')
const modelStatus = ref('')
const debugInfo = ref('')

// 模型配置
const modelPath = '/models/Qsage模型1/qsage.model3.json'
let app = null
let model = null
let currentScale = 0.3
let isAnimating = false

// 初始化 Pixi 应用
const initPixiApp = () => {
  if (!canvasRef.value) {
    console.error('canvasRef 不存在')
    return
  }

  try {
    app = new PIXI.Application({
      view: canvasRef.value,
      width: 800,
      height: 800,
      backgroundAlpha: 0,
      autoDensity: true,
      antialias: true,
      resolution: window.devicePixelRatio || 1
    })
    
    console.log('Pixi 应用初始化成功')
    debugInfo.value += '✓ Pixi 初始化成功\n'
    
  } catch (err) {
    console.error('Pixi 初始化失败:', err)
    error.value = `Pixi 初始化失败: ${err.message}`
  }
}

// 测试模型文件是否存在
const testModelFile = async (path) => {
  try {
    const response = await fetch(path)
    if (response.ok) {
      debugInfo.value += `✓ 文件存在: ${path}\n`
      return true
    } else {
      debugInfo.value += `✗ 文件不存在: ${path} (${response.status})\n`
      return false
    }
  } catch (err) {
    debugInfo.value += `✗ 无法访问: ${path} - ${err.message}\n`
    return false
  }
}

// 加载 Live2D 模型
const loadModel = async () => {
  try {
    loading.value = true
    error.value = ''
    modelStatus.value = '正在加载模型...'
    debugInfo.value = '=== 开始加载模型 ===\n'
    debugInfo.value += `使用 Cubism 4 运行时\n`
    
    // 测试文件是否存在
    debugInfo.value += `尝试加载: ${modelPath}\n`
    const fileExists = await testModelFile(modelPath)
    if (!fileExists) {
      throw new Error(`模型文件不存在: ${modelPath}`)
    }
    
    console.log('开始加载模型:', modelPath)
    debugInfo.value += `开始加载 Live2D 模型...\n`
    
    // 加载模型
    model = await Live2DModel.from(modelPath)
    
    debugInfo.value += `✓ Live2D 模型对象创建成功\n`
    
    // 添加到舞台
    app.stage.addChild(model)
    debugInfo.value += `✓ 模型已添加到舞台\n`

    // 获取画布尺寸
    const canvasWidth = canvasRef.value.clientWidth || 800
    const canvasHeight = canvasRef.value.clientHeight || 800
    
    // 设置模型位置和大小
    model.scale.set(currentScale)
    model.x = canvasWidth / 2
    model.y = canvasHeight / 2
    model.anchor.set(0.5, 0.5)
    
    debugInfo.value += `模型位置: (${model.x}, ${model.y})\n`
    debugInfo.value += `模型缩放: ${currentScale}\n`

    // 启用交互
    model.interactive = true
    model.buttonMode = true

    // 添加事件监听
    model.on('pointerdown', onModelClick)
    model.on('pointerenter', onModelHover)
    model.on('pointerleave', onModelLeave)

    loading.value = false
    modelStatus.value = '✓ 模型加载成功！点击模型试试看~'
    debugInfo.value += `✓✓✓ 模型加载完成！✓✓✓\n`
    console.log('Qsage 模型加载成功', model)
    
    // 强制渲染一次
    app.renderer.render(app.stage)
    
    // 3秒后清除状态提示
    setTimeout(() => {
      if (modelStatus.value === '✓ 模型加载成功！点击模型试试看~') {
        modelStatus.value = ''
      }
    }, 3000)
    
  } catch (err) {
    console.error('模型加载失败:', err)
    debugInfo.value += `✗ 加载失败: ${err.message}\n`
    error.value = `模型加载失败: ${err.message}\n\n请检查:\n1. 模型文件格式是否正确\n2. 所有相关文件是否完整\n3. 控制台查看详细错误`
    loading.value = false
    modelStatus.value = '模型加载失败'
  }
}

// 重新加载模型
const reloadModel = () => {
  if (model) {
    model.destroy()
    model = null
  }
  loadModel()
}

// 模型点击事件
const onModelClick = () => {
  console.log('点击了模型')
  modelStatus.value = '你点击了模型！'
  
  // 点击动画效果
  model.scale.set(currentScale * 0.95)
  setTimeout(() => {
    model.scale.set(currentScale)
  }, 100)
  
  setTimeout(() => {
    if (modelStatus.value === '你点击了模型！') {
      modelStatus.value = ''
    }
  }, 1500)
  
  // 播放随机动作
  playRandomMotion()
}

// 鼠标悬停效果
const onModelHover = () => {
  model.scale.set(currentScale * 1.05)
  modelStatus.value = '鼠标悬停在模型上'
}

const onModelLeave = () => {
  model.scale.set(currentScale)
  setTimeout(() => {
    if (modelStatus.value === '鼠标悬停在模型上') {
      modelStatus.value = ''
    }
  }, 1000)
}

// 调整模型大小
const changeModelScale = () => {
  if (!model) return
  
  currentScale = Math.min(currentScale + 0.05, 0.6)
  model.scale.set(currentScale)
  modelStatus.value = `模型大小: ${Math.round(currentScale * 100)}%`
  
  setTimeout(() => {
    if (modelStatus.value.includes('模型大小')) {
      modelStatus.value = ''
    }
  }, 1500)
}

// 重置模型大小
const resetModelScale = () => {
  if (!model) return
  
  currentScale = 0.3
  model.scale.set(currentScale)
  modelStatus.value = '已重置模型大小'
  
  setTimeout(() => {
    if (modelStatus.value === '已重置模型大小') {
      modelStatus.value = ''
    }
  }, 1500)
}

// 播放随机动作
const playRandomMotion = () => {
  if (!model || isAnimating) return
  
  isAnimating = true
  modelStatus.value = '播放动画中...'
  
  try {
    // 获取可用的动作组
    if (model.internalModel && model.internalModel.motionManager) {
      // 尝试播放默认动作
      model.motion('TapBody')
      console.log('播放动作: TapBody')
    }
    
    setTimeout(() => {
      isAnimating = false
      if (modelStatus.value === '播放动画中...') {
        modelStatus.value = ''
      }
    }, 2000)
    
  } catch (e) {
    console.log('动作播放失败:', e)
    modelStatus.value = '该模型暂不支持动作'
    setTimeout(() => {
      if (modelStatus.value === '该模型暂不支持动作') {
        modelStatus.value = ''
      }
    }, 1500)
    isAnimating = false
  }
}

// 调整画布尺寸
const resizeCanvas = () => {
  if (!app || !containerRef.value) return
  
  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight
  
  if (width > 0 && height > 0) {
    app.renderer.resize(width, height)
    if (model) {
      model.x = width / 2
      model.y = height / 2
    }
  }
}

// 生命周期
onMounted(async () => {
  console.log('组件挂载，开始初始化...')
  debugInfo.value = '组件已挂载\n'
  
  // 等待 DOM 渲染
  await new Promise(resolve => setTimeout(resolve, 100))
  
  initPixiApp()
  
  if (app) {
    await loadModel()
    window.addEventListener('resize', resizeCanvas)
    resizeCanvas()
  } else {
    error.value = 'Pixi 应用初始化失败，请检查控制台'
    loading.value = false
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
  if (model) {
    model.off('pointerdown', onModelClick)
    model.off('pointerenter', onModelHover)
    model.off('pointerleave', onModelLeave)
    model.destroy()
  }
  if (app) {
    app.destroy(true, true)
  }
})
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
  font-family: 'Arial', sans-serif;
}

.content {
  position: absolute;
  top: 20px;
  left: 20px;
  text-align: left;
  color: white;
  z-index: 10;
  pointer-events: none;
  max-width: 400px;
}

.content h1 {
  font-size: 36px;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.content p {
  font-size: 14px;
  margin-bottom: 20px;
  opacity: 0.9;
}

.button-group {
  display: flex;
  gap: 10px;
  justify-content: flex-start;
  flex-wrap: wrap;
  margin-bottom: 15px;
}

.content button {
  pointer-events: auto;
  padding: 8px 16px;
  font-size: 14px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  transition: all 0.3s;
  backdrop-filter: blur(10px);
  font-weight: 500;
}

.content button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.status {
  margin-top: 10px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 6px;
  font-size: 12px;
  display: inline-block;
  backdrop-filter: blur(5px);
}

.debug-info {
  margin-top: 15px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 6px;
  padding: 8px;
  font-size: 10px;
  max-width: 350px;
  max-height: 200px;
  overflow: auto;
}

.debug-info details {
  cursor: pointer;
}

.debug-info pre {
  margin: 5px 0;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: monospace;
  font-size: 10px;
}

.live2d-container {
  position: fixed;
  bottom: 0;
  right: 0;
  width: 600px;
  height: 700px;
  pointer-events: auto;
  z-index: 20;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  overflow: hidden;
}

.live2d-container canvas {
  width: 100%;
  height: 100%;
  display: block;
  cursor: pointer;
}

.loading-tip {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: white;
  z-index: 30;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 10px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.error-tip {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 0, 0, 0.9);
  color: white;
  padding: 15px 25px;
  border-radius: 10px;
  font-size: 14px;
  text-align: center;
  max-width: 300px;
  z-index: 30;
  backdrop-filter: blur(5px);
  white-space: pre-line;
}

.retry-btn {
  margin-top: 10px;
  padding: 5px 15px;
  background: white;
  color: #333;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .content {
    top: 10px;
    left: 10px;
    max-width: 300px;
  }
  
  .content h1 {
    font-size: 24px;
  }
  
  .live2d-container {
    width: 100%;
    height: 50%;
    bottom: 0;
    right: 0;
  }
}
</style>