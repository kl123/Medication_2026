<template>
  <div class="app">
    <!-- 对话页面容器 -->
    <div class="chat-container">
      <!-- 顶部导航栏 -->
      <div class="chat-header">
        <div class="header-back" @click="goBack">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="header-title">
          <span class="title-text">AI 情感陪护数字人</span>
          <span class="status-badge" v-if="isTTSEnabled">🔊 语音合成中</span>
          <span class="status-badge" v-else-if="isConnected">🔗 服务已连接</span>
          <span class="status-badge offline" v-else>⚡ 离线模式</span>
        </div>
        <div class="header-menu" @click="toggleMenu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M4 6H20M4 12H20M4 18H20" stroke="white" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
      </div>

      <!-- 心理状态指示器 -->
      <div class="state-indicator" v-if="currentState">
        <div class="state-card">
          <div class="state-label">当前心理状态</div>
          <div class="state-value">
            <span class="state-score">PHQ-8: {{ currentState.PHQ8_Score }}</span>
            <span class="state-level" :class="getStateLevel(currentState.PHQ8_Score)">
              {{ getStateDesc(currentState.PHQ8_Score) }}
            </span>
          </div>
          <div class="symptoms-preview">
            <div class="symptom-item" v-for="(value, idx) in currentState.Core_Symptoms_Vector?.slice(0, 4)" :key="idx">
              <span class="symptom-name">{{ symptomNames[idx] }}</span>
              <div class="symptom-bar">
                <div class="symptom-fill" :style="{ width: (value / 3 * 100) + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 聊天内容区域 -->
      <div class="chat-messages" ref="messagesContainer">
        <div v-for="(message, index) in messages" :key="index" class="message-wrapper">
          <!-- 用户消息（右侧） -->
          <div v-if="message.type === 'user'" class="message user-message">
            <div class="message-content">
              <div class="message-bubble user-bubble">
                {{ message.content }}
              </div>
              <div class="message-time">{{ message.time }}</div>
            </div>
            <div class="message-avatar user-avatar">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="20" fill="#07C160"/>
                <path d="M20 10C16.7 10 14 12.7 14 16C14 19.3 16.7 22 20 22C23.3 22 26 19.3 26 16C26 12.7 23.3 10 20 10ZM20 24C15 24 11 28 11 30H29C29 28 25 24 20 24Z" fill="white"/>
              </svg>
            </div>
          </div>

          <!-- 助手消息（左侧） -->
          <div v-else class="message assistant-message">
            <div class="message-avatar assistant-avatar">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="20" fill="#576B95"/>
                <path d="M20 12L12 20L20 28L28 20L20 12Z" fill="white"/>
                <circle cx="20" cy="20" r="3" fill="#576B95"/>
              </svg>
            </div>
            <div class="message-content">
              <div class="message-bubble assistant-bubble">
                {{ message.content }}
                <span v-if="message.isPlaying" class="playing-indicator">🔊</span>
              </div>
              <div class="message-time">{{ message.time }}</div>
            </div>
          </div>
        </div>

        <!-- 干预路径提示 -->
        <div v-if="suggestedPath && suggestedPath.length > 0" class="path-suggestion">
          <div class="path-header">
            <span>💡 建议干预路径</span>
            <span class="path-cost">总代价: {{ totalPathCost.toFixed(2) }}</span>
          </div>
          <div class="path-steps">
            <div v-for="(step, idx) in suggestedPath" :key="idx" class="path-step">
              <span class="step-index">{{ idx + 1 }}</span>
              <span class="step-node">节点 {{ step.node_id }}</span>
              <span class="step-cost" v-if="idx > 0">→ {{ step.cost.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <!-- 语音合成状态提示 -->
        <div v-if="isTTSPlaying" class="tts-status-tip">
          <div class="tip-content">
            <span class="tip-icon">🔊</span>
            <span>正在播放语音回复...</span>
            <div class="voice-wave">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部输入区域 -->
      <div class="chat-input-area">
        <div class="input-tools">
          <button class="tool-btn" @click="toggleTTS" :class="{ active: isTTSEnabled }" title="语音合成开关">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M13 2L8 6H4V10H8L13 14V2Z" fill="currentColor" stroke="currentColor" stroke-width="1"/>
              <path d="M15 7C16 8 16 9 15 10" stroke="currentColor" stroke-width="1.5" fill="none"/>
            </svg>
          </button>
          <select v-model="selectedVoice" class="voice-select" :disabled="!isTTSEnabled">
            <option value="情感陪伴_女_温柔">温柔女声（默认）</option>
            <option value="普通话_女_温暖">温暖女声</option>
            <option value="普通话_男_活力">活力男声</option>
            <option value="东北话_女">东北话</option>
            <option value="四川话_男">四川话</option>
            <option value="粤语_女">粤语</option>
          </select>
        </div>
        
        <div class="input-box">
          <input 
            type="text" 
            v-model="inputMessage" 
            @keyup.enter="sendMessage"
            :placeholder="isTTSPlaying ? '语音播放中，请稍后...' : '输入消息，数字人会语音回复你...'"
            :disabled="isTTSPlaying"
          />
          <button class="send-btn" @click="sendMessage" :disabled="!inputMessage.trim() || isTTSPlaying">
            发送
          </button>
        </div>
        
        <!-- 音量指示器 -->
        <div class="volume-indicator" v-if="isTTSPlaying">
          <div class="volume-bar" :style="{ width: volumeLevel + '%' }"></div>
          <span class="volume-text">{{ Math.floor(volumeLevel) }}%</span>
        </div>
      </div>
    </div>

    <!-- Live2D 模型浮动容器 -->
    <div 
      class="floating-model"
      :style="{
        transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(${containerScale})`,
        width: baseSize.width + 'px',
        height: baseSize.height + 'px'
      }"
      @mousedown="startDrag"
      @touchstart="startDrag"
    >
      <div class="model-controls">
        <button class="control-btn zoom-out" @click.stop="zoomOut" :disabled="containerScale <= minScale">−</button>
        <button class="control-btn zoom-in" @click.stop="zoomIn" :disabled="containerScale >= maxScale">+</button>
        <button class="control-btn reset" @click.stop="resetZoom">↺</button>
      </div>
      
      <div class="model-wrapper">
        <canvas ref="canvasRef"></canvas>
        <div class="drag-handle" v-if="!loading && !error">
          <span>✋ 可拖动</span>
        </div>
      </div>
      
      <div class="scale-indicator" v-if="showScaleIndicator">
        {{ Math.round(containerScale * 100) }}%
      </div>
      
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
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as PIXI from 'pixi.js'
import { Live2DModel } from 'pixi-live2d-display/cubism4'

window.PIXI = PIXI

// API 配置
const API_BASE_URL = 'http://127.0.0.1:8000'

// 响应式数据
const canvasRef = ref(null)
const messagesContainer = ref(null)
const loading = ref(true)
const error = ref('')
const isTTSEnabled = ref(true) // 默认开启语音合成
const isTTSPlaying = ref(false)
const volumeLevel = ref(0)
const inputMessage = ref('')
const isConnected = ref(false)
const showScaleIndicator = ref(false)
const selectedVoice = ref('情感陪伴_女_温柔')

// 心理状态数据
const currentState = ref(null)
const suggestedPath = ref([])
const totalPathCost = ref(0)

// 拖动相关
const dragOffset = ref({ x: 0, y: 0 })
let isDragging = false
let dragStartPos = { x: 0, y: 0 }
let modelStartPos = { x: 0, y: 0 }

// 缩放相关
const containerScale = ref(1.0)
const minScale = 0.5
const maxScale = 2.0
const baseSize = { width: 180, height: 180 }

// 模型相关
const modelPath = '/models/Qsage模型1/qsage.model3.json'
let app = null
let model = null
let modelScale = ref(0.1)

// 音频相关
let audioContext = null
let sourceNode = null
let analyserNode = null
let animationFrameId = null
let mouthParamIds = []
let scaleIndicatorTimer = null
let currentTTSAudio = null

// 症状名称
const symptomNames = ['缺乏兴趣', '情绪低落', '睡眠障碍', '疲乏无力', '食欲异常', '挫败感', '注意力难集中', '迟缓或烦躁']

// 对话消息列表
const messages = ref([
  {
    type: 'assistant',
    content: '你好！我是你的AI情感陪护数字人。我会倾听你的心声，理解你的情绪，并用语音回复你。输入文字与我对话吧！',
    time: getCurrentTime(),
    isPlaying: false
  }
])

// 获取当前时间
function getCurrentTime() {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
}

// 状态等级
function getStateDesc(score) {
  if (score <= 4) return '正常'
  if (score <= 9) return '轻度抑郁'
  if (score <= 14) return '中度抑郁'
  if (score <= 19) return '中重度抑郁'
  return '重度抑郁'
}

function getStateLevel(score) {
  if (score <= 4) return 'normal'
  if (score <= 9) return 'mild'
  if (score <= 14) return 'moderate'
  if (score <= 19) return 'moderate-severe'
  return 'severe'
}

// ========== 语音合成功能 ==========
// 调用TTS接口合成语音
async function synthesizeSpeech(text) {
  if (!isTTSEnabled.value) return null
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/interactive/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        voice_type: selectedVoice.value
      })
    })
    
    if (response.ok) {
      const audioBlob = await response.blob()
      return URL.createObjectURL(audioBlob)
    }
    return null
  } catch (err) {
    console.error('TTS合成失败:', err)
    return null
  }
}

// 播放TTS语音
async function playTTS(text, messageIndex) {
  if (!isTTSEnabled.value) return
  
  try {
    isTTSPlaying.value = true
    
    // 更新消息播放状态
    if (messageIndex !== undefined) {
      messages.value[messageIndex].isPlaying = true
    }
    
    // 合成语音
    const audioUrl_ = await synthesizeSpeech(text)
    
    if (audioUrl_) {
      // 创建音频元素播放
      if (currentTTSAudio) {
        currentTTSAudio.pause()
        currentTTSAudio.src = ''
      }
      
      currentTTSAudio = new Audio(audioUrl_)
      
      // 设置音频分析器用于口型同步
      setupAudioAnalyzerForTTS(currentTTSAudio)
      
      // 播放音频
      currentTTSAudio.play()
      
      // 监听播放结束
      currentTTSAudio.onended = () => {
        isTTSPlaying.value = false
        if (messageIndex !== undefined) {
          messages.value[messageIndex].isPlaying = false
        }
        // 清理音频分析器
        cleanupAudioAnalyzer()
        // 重置口型
        resetMouthOpen()
        volumeLevel.value = 0
        URL.revokeObjectURL(audioUrl_)
      }
      
      // 监听播放错误
      currentTTSAudio.onerror = () => {
        isTTSPlaying.value = false
        if (messageIndex !== undefined) {
          messages.value[messageIndex].isPlaying = false
        }
        cleanupAudioAnalyzer()
        resetMouthOpen()
      }
    } else {
      isTTSPlaying.value = false
      if (messageIndex !== undefined) {
        messages.value[messageIndex].isPlaying = false
      }
    }
  } catch (err) {
    console.error('播放TTS失败:', err)
    isTTSPlaying.value = false
    if (messageIndex !== undefined) {
      messages.value[messageIndex].isPlaying = false
    }
  }
}

// 为TTS设置音频分析器
function setupAudioAnalyzerForTTS(audioElement_) {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)()
    }
    
    // 清理旧的节点
    if (sourceNode) {
      try { sourceNode.disconnect() } catch(e) {}
    }
    if (analyserNode) {
      try { analyserNode.disconnect() } catch(e) {}
    }
    
    sourceNode = audioContext.createMediaElementSource(audioElement_)
    analyserNode = audioContext.createAnalyser()
    analyserNode.fftSize = 256
    
    sourceNode.connect(analyserNode)
    analyserNode.connect(audioContext.destination)
    
    // 启动音量检测
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }
    animationFrameId = requestAnimationFrame(updateMouthByVolume)
    
    // 恢复AudioContext
    if (audioContext.state === 'suspended') {
      audioContext.resume()
    }
  } catch (err) {
    console.error('设置音频分析器失败:', err)
  }
}

// 清理音频分析器
function cleanupAudioAnalyzer() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  if (sourceNode) {
    try { sourceNode.disconnect() } catch(e) {}
    sourceNode = null
  }
  if (analyserNode) {
    try { analyserNode.disconnect() } catch(e) {}
    analyserNode = null
  }
}

// ========== 对话处理 ==========
// 发送消息
const sendMessage = async () => {
  const text = inputMessage.value.trim()
  if (!text) return
  if (isTTSPlaying.value) return
  
  // 添加用户消息
  messages.value.push({
    type: 'user',
    content: text,
    time: getCurrentTime(),
    isPlaying: false
  })
  
  inputMessage.value = ''
  scrollToBottom()
  
  // 显示"正在思考"状态
  const thinkingIndex = messages.value.length
  messages.value.push({
    type: 'assistant',
    content: '思考中...',
    time: getCurrentTime(),
    isPlaying: false
  })
  scrollToBottom()
  
  // 分析情绪并生成回复
  await processUserMessage(text, thinkingIndex)
}

// 处理用户消息
async function processUserMessage(text, thinkingIndex) {
  try {
    // 生成回复内容
    let reply = await generateReply(text)
    
    // 替换思考中的消息
    messages.value[thinkingIndex] = {
      type: 'assistant',
      content: reply,
      time: getCurrentTime(),
      isPlaying: false
    }
    scrollToBottom()
    
    // 播放语音合成
    await playTTS(reply, thinkingIndex)
    
  } catch (err) {
    console.error('处理消息失败:', err)
    messages.value[thinkingIndex] = {
      type: 'assistant',
      content: '抱歉，我暂时无法回复，请稍后再试。',
      time: getCurrentTime(),
      isPlaying: false
    }
    scrollToBottom()
  }
}

// 生成回复内容（集成心理评估）
async function generateReply(text) {
  // 生成模拟的症状向量
  const mockVector = generateMockVector(text)
  
  // 尝试调用后端接口
  if (isConnected.value) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/get_weight_by_vector`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vector_a: mockVector,
          vector_b: [0, 0, 0, 0, 0, 0, 0, 0]
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.status === 'success') {
          currentState.value = result.data.source_node_details
          buildInterventionPath(result.data)
          return generateEmotionalResponse(text, result.data)
        }
      }
    } catch (err) {
      console.warn('后端调用失败，使用离线模式')
    }
  }
  
  // 离线模式回复
  return generateOfflineReply(text, mockVector)
}

// 生成模拟向量
function generateMockVector(text) {
  const keywords = {
    '累': [0.2, 0.1, 0.3, 0.8, 0.1, 0.2, 0.3, 0.2],
    '难过': [0.1, 0.9, 0.2, 0.3, 0.2, 0.7, 0.4, 0.1],
    '焦虑': [0.2, 0.3, 0.4, 0.2, 0.1, 0.3, 0.8, 0.5],
    '开心': [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
    '失眠': [0.3, 0.4, 0.9, 0.3, 0.2, 0.3, 0.4, 0.2],
    '压力': [0.2, 0.3, 0.2, 0.4, 0.1, 0.5, 0.6, 0.3],
    '孤独': [0.4, 0.5, 0.2, 0.2, 0.1, 0.6, 0.3, 0.1]
  }
  
  let vector = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]
  for (const [key, val] of Object.entries(keywords)) {
    if (text.includes(key)) {
      vector = vector.map((v, i) => (v + val[i]) / 2)
    }
  }
  return vector
}

// 构建干预路径
function buildInterventionPath(data) {
  suggestedPath.value = [
    { node_id: data.mapped_source_node, cost: 0 },
    { node_id: data.mapped_target_node, cost: data.distance_cost }
  ]
  totalPathCost.value = data.distance_cost
}

// 生成情感回复
function generateEmotionalResponse(text, analysis) {
  const score = analysis.source_node_details.PHQ8_Score
  
  if (score <= 4) {
    return '看起来你最近状态不错！继续保持积极的心态。有什么想分享的吗？'
  } else if (score <= 9) {
    return '我注意到你可能有些情绪波动。这很正常，每个人都会有这样的时刻。要不要和我聊聊最近发生了什么？'
  } else if (score <= 14) {
    return '你的情绪状态需要一些关注。我建议我们可以一起探索一些放松的方法，比如深呼吸或正念练习。你愿意试试吗？'
  } else {
    return '你的感受非常重要。如果觉得压力很大，请记得寻求专业帮助。我会一直在这里陪着你，倾听你的心声。'
  }
}

// 离线回复生成
function generateOfflineReply(text, vector) {
  // 计算平均症状强度
  const avgIntensity = vector.reduce((a, b) => a + b, 0) / 8
  
  if (text.includes('累') || text.includes('疲惫')) {
    return '听到你说累，我理解这种感受。记得给自己一些休息的时间，适当的放松很重要。需要我陪你聊聊天吗？'
  } else if (text.includes('难过') || text.includes('伤心')) {
    return '我能感受到你的难过。允许自己表达情绪是健康的，我会一直在这里倾听你的心声。'
  } else if (text.includes('焦虑') || text.includes('紧张')) {
    return '焦虑是很常见的情绪。让我们试试深呼吸：吸气...呼气...慢慢来，我陪着你。'
  } else if (text.includes('开心') || text.includes('高兴')) {
    return '真为你感到开心！继续保持这份好心情，生活中总有美好的时刻。'
  } else if (text.includes('失眠') || text.includes('睡不着')) {
    return '睡眠问题确实很困扰人。睡前可以试试听些轻音乐，或者做些轻柔的伸展运动。'
  } else if (avgIntensity > 0.7) {
    return '我感受到了你的情绪波动。每个人都会经历起起落落，重要的是照顾好自己。需要我陪你聊聊吗？'
  } else {
    const replies = [
      '我听到了你的声音。能和我多说说你的感受吗？',
      '感谢你和我分享这些，我在这里陪着你。',
      '你的感受很重要，让我们一起面对吧。',
      '我理解你的心情，有什么我可以帮你的吗？'
    ]
    return replies[Math.floor(Math.random() * replies.length)]
  }
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// 切换TTS
const toggleTTS = () => {
  isTTSEnabled.value = !isTTSEnabled.value
  if (!isTTSEnabled.value && isTTSPlaying.value && currentTTSAudio) {
    currentTTSAudio.pause()
    isTTSPlaying.value = false
    cleanupAudioAnalyzer()
    resetMouthOpen()
  }
}

// ========== 口型同步核心 ==========
const setMouthOpen = (value) => {
  if (!model || !model.internalModel) return
  
  try {
    const coreModel = model.internalModel.coreModel
    if (!coreModel) return
    
    const clampedValue = Math.min(1, Math.max(0, value))
    
    for (const param of mouthParamIds) {
      try {
        if (typeof coreModel.setParameterValue === 'function') {
          coreModel.setParameterValue(param.id, clampedValue)
        }
      } catch (e) {}
    }
  } catch (err) {}
}

const resetMouthOpen = () => {
  if (!model || !model.internalModel) return
  
  try {
    const coreModel = model.internalModel.coreModel
    if (!coreModel) return
    
    for (const param of mouthParamIds) {
      try {
        if (typeof coreModel.setParameterValue === 'function') {
          coreModel.setParameterValue(param.id, 0)
        }
      } catch (e) {}
    }
  } catch (err) {}
}

const updateMouthByVolume = () => {
  if (!isTTSPlaying.value) {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
    return
  }
  
  if (!analyserNode || !model) {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
    return
  }
  
  const dataArray = new Uint8Array(analyserNode.frequencyBinCount)
  analyserNode.getByteFrequencyData(dataArray)
  
  let sum = 0
  for (let i = 0; i < dataArray.length; i++) {
    sum += dataArray[i]
  }
  let avg = sum / dataArray.length
  let volume = Math.min(1, Math.max(0, (avg - 10) / 200))
  
  volumeLevel.value = volume * 100
  const mouthOpenValue = 0.05 + volume * 0.95
  
  setMouthOpen(mouthOpenValue)
  
  animationFrameId = requestAnimationFrame(updateMouthByVolume)
}

// ========== Live2D 模型功能 ==========
const initPixiApp = () => {
  if (!canvasRef.value) return

  try {
    app = new PIXI.Application({
      view: canvasRef.value,
      width: baseSize.width,
      height: baseSize.height,
      backgroundAlpha: 0,
      autoDensity: true,
      antialias: true,
      resolution: window.devicePixelRatio || 1
    })
  } catch (err) {
    console.error('Pixi 初始化失败:', err)
    error.value = `Pixi 初始化失败: ${err.message}`
  }
}

const loadModel = async () => {
  try {
    loading.value = true
    error.value = ''
    
    model = await Live2DModel.from(modelPath)
    app.stage.addChild(model)

    const canvasWidth = baseSize.width
    const canvasHeight = baseSize.height
    
    modelScale.value = 0.1
    model.scale.set(modelScale.value)
    model.x = canvasWidth / 2
    model.y = canvasHeight / 2
    model.anchor.set(0.5, 0.5)

    model.interactive = true
    model.buttonMode = true

    model.on('pointerdown', (event) => {
      event.stopPropagation()
      onModelClick()
    })
    model.on('pointerenter', onModelHover)
    model.on('pointerleave', onModelLeave)

    initMouthParameters()

    loading.value = false
    app.renderer.render(app.stage)
    
  } catch (err) {
    console.error('模型加载失败:', err)
    error.value = `模型加载失败: ${err.message}`
    loading.value = false
  }
}

const initMouthParameters = () => {
  try {
    if (!model || !model.internalModel) return
    
    const coreModel = model.internalModel.coreModel
    if (!coreModel) return
    
    const mouthParamNames = ['ParamMouthOpenY', 'ParamMouthForm', 'ParamMouthOpen']
    mouthParamIds = []
    
    for (const paramName of mouthParamNames) {
      try {
        if (typeof coreModel.getParameterIndex === 'function') {
          const paramIndex = coreModel.getParameterIndex(paramName)
          if (paramIndex !== -1 && paramIndex !== undefined) {
            mouthParamIds.push({ id: paramIndex, name: paramName })
          }
        }
      } catch (e) {}
    }
  } catch (err) {}
}

const reloadModel = () => {
  if (model) {
    model.destroy()
    model = null
  }
  loadModel()
}

const onModelClick = () => {
  const originalScale = modelScale.value
  model.scale.set(originalScale * 0.95)
  setTimeout(() => {
    model.scale.set(originalScale)
  }, 100)
}

const onModelHover = () => {
  model.scale.set(modelScale.value * 1.05)
}

const onModelLeave = () => {
  model.scale.set(modelScale.value)
}

// ========== 拖动缩放功能 ==========
const zoomIn = () => {
  if (containerScale.value < maxScale) {
    containerScale.value = Math.min(maxScale, containerScale.value + 0.1)
    showScaleTip()
  }
}

const zoomOut = () => {
  if (containerScale.value > minScale) {
    containerScale.value = Math.max(minScale, containerScale.value - 0.1)
    showScaleTip()
  }
}

const resetZoom = () => {
  containerScale.value = 1.0
  showScaleTip()
}

const showScaleTip = () => {
  showScaleIndicator.value = true
  if (scaleIndicatorTimer) clearTimeout(scaleIndicatorTimer)
  scaleIndicatorTimer = setTimeout(() => {
    showScaleIndicator.value = false
  }, 1000)
}

const startDrag = (event) => {
  event.preventDefault()
  isDragging = true
  
  if (event.type === 'mousedown') {
    dragStartPos = { x: event.clientX, y: event.clientY }
  } else if (event.type === 'touchstart') {
    const touch = event.touches[0]
    dragStartPos = { x: touch.clientX, y: touch.clientY }
  }
  
  modelStartPos = { x: dragOffset.value.x, y: dragOffset.value.y }
  
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchmove', onDrag)
  document.addEventListener('touchend', stopDrag)
}

const onDrag = (event) => {
  if (!isDragging) return
  event.preventDefault()
  
  let currentX, currentY
  if (event.type === 'mousemove') {
    currentX = event.clientX
    currentY = event.clientY
  } else if (event.type === 'touchmove') {
    const touch = event.touches[0]
    currentX = touch.clientX
    currentY = touch.clientY
  }
  
  const deltaX = currentX - dragStartPos.x
  const deltaY = currentY - dragStartPos.y
  
  const newX = modelStartPos.x + deltaX
  const newY = modelStartPos.y + deltaY
  
  const maxX = window.innerWidth - 200
  const maxY = window.innerHeight - 200
  
  dragOffset.value = {
    x: Math.min(maxX, Math.max(-200, newX)),
    y: Math.min(maxY, Math.max(-200, newY))
  }
}

const stopDrag = () => {
  isDragging = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)
}

// ========== 连接检测 ==========
async function checkConnection() {
  try {
    const response = await fetch(`${API_BASE_URL}/docs`)
    isConnected.value = response.ok
    if (isConnected.value) {
      messages.value.push({
        type: 'assistant',
        content: '✅ 后端服务已连接，现在可以进行心理状态分析、语音合成和路径规划了！',
        time: getCurrentTime(),
        isPlaying: false
      })
      scrollToBottom()
    }
  } catch (err) {
    isConnected.value = false
    console.warn('后端服务未启动，使用离线模式')
  }
}

// ========== 生命周期 ==========
onMounted(async () => {
  await new Promise(resolve => setTimeout(resolve, 100))
  
  initPixiApp()
  
  if (app) {
    await loadModel()
    window.addEventListener('resize', resizeCanvas)
    setTimeout(resizeCanvas, 100)
    await checkConnection()
  } else {
    error.value = 'Pixi 应用初始化失败'
    loading.value = false
  }
})

const resizeCanvas = () => {
  if (!app || !canvasRef.value) return
  app.renderer.resize(baseSize.width, baseSize.height)
  if (model) {
    model.x = baseSize.width / 2
    model.y = baseSize.height / 2
  }
}

const goBack = () => console.log('返回')
const toggleMenu = () => console.log('菜单')

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
  
  if (currentTTSAudio) {
    currentTTSAudio.pause()
    currentTTSAudio.src = ''
  }
  
  if (audioContext) {
    audioContext.close().catch(console.warn)
  }
  
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
/* 样式保持不变，与之前相同 */
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
}

.chat-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  z-index: 10;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
}

.chat-header {
  background: linear-gradient(135deg, #2c3e50, #3498db);
  color: white;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.header-back, .header-menu {
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-back:hover, .header-menu:hover {
  background: rgba(255, 255, 255, 0.2);
}

.header-title {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.title-text {
  font-size: 18px;
  font-weight: 600;
}

.status-badge {
  font-size: 10px;
  background: rgba(255, 255, 255, 0.3);
  padding: 2px 8px;
  border-radius: 12px;
}

.status-badge.offline {
  background: rgba(244, 67, 54, 0.8);
}

/* 状态指示器 */
.state-indicator {
  padding: 12px 16px;
  background: linear-gradient(135deg, #f5f7fa, #e8ecf1);
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.state-card {
  background: white;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.state-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.state-value {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.state-score {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.state-level {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
}

.state-level.normal { background: #4caf50; color: white; }
.state-level.mild { background: #ff9800; color: white; }
.state-level.moderate { background: #ffc107; color: #333; }
.state-level.moderate-severe { background: #f44336; color: white; }
.state-level.severe { background: #9c27b0; color: white; }

.symptoms-preview {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.symptom-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
}

.symptom-name {
  width: 55px;
  color: #666;
}

.symptom-bar {
  flex: 1;
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
}

.symptom-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #ff9800, #f44336);
  border-radius: 3px;
  transition: width 0.3s ease;
}

/* 聊天区域 */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: transparent;
}

.message-wrapper {
  margin-bottom: 16px;
}

.message {
  display: flex;
  gap: 12px;
  animation: fadeIn 0.3s ease-in;
}

.user-message {
  flex-direction: row-reverse;
}

.assistant-message {
  flex-direction: row;
}

.message-avatar {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.user-avatar svg, .assistant-avatar svg {
  width: 100%;
  height: 100%;
}

.message-content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-message .message-content {
  align-items: flex-end;
}

.assistant-message .message-content {
  align-items: flex-start;
}

.message-bubble {
  padding: 10px 14px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
  word-break: break-word;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  position: relative;
}

.user-bubble {
  background: #07C160;
  color: white;
  border-bottom-right-radius: 4px;
}

.assistant-bubble {
  background: white;
  color: #333;
  border-bottom-left-radius: 4px;
}

.playing-indicator {
  display: inline-block;
  margin-left: 8px;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1); }
}

.message-time {
  font-size: 10px;
  color: #999;
  padding: 0 8px;
}

/* 路径建议 */
.path-suggestion {
  margin: 12px 0;
  padding: 12px;
  background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
  border-radius: 12px;
  border-left: 4px solid #4caf50;
}

.path-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 600;
  color: #2e7d32;
}

.path-steps {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.path-step {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: white;
  padding: 4px 8px;
  border-radius: 16px;
  font-size: 11px;
}

.step-index {
  width: 18px;
  height: 18px;
  background: #4caf50;
  color: white;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
}

/* 状态提示 */
.tts-status-tip {
  display: flex;
  justify-content: center;
  margin: 8px 0;
  animation: fadeIn 0.3s ease;
}

.tip-content {
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  color: white;
  display: flex;
  align-items: center;
  gap: 8px;
}

.voice-wave {
  display: flex;
  gap: 3px;
  align-items: center;
}

.voice-wave span {
  width: 3px;
  height: 12px;
  background: #4caf50;
  border-radius: 2px;
  animation: wave 1s ease-in-out infinite;
}

.voice-wave span:nth-child(2) {
  animation-delay: 0.2s;
  height: 16px;
}

.voice-wave span:nth-child(3) {
  animation-delay: 0.4s;
  height: 20px;
}

@keyframes wave {
  0%, 100% { height: 8px; }
  50% { height: 20px; }
}

/* 输入区域 */
.chat-input-area {
  background: white;
  border-top: 1px solid #e0e0e0;
  padding: 12px 16px;
  flex-shrink: 0;
}

.input-tools {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  align-items: center;
}

.tool-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  color: #666;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tool-btn:hover {
  background: #f0f0f0;
  color: #07C160;
}

.tool-btn.active {
  color: #07C160;
  background: rgba(7, 193, 96, 0.1);
}

.voice-select {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  font-size: 12px;
  background: white;
  cursor: pointer;
}

.input-box {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.input-box input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s;
}

.input-box input:focus {
  border-color: #07C160;
}

.send-btn {
  padding: 8px 20px;
  background: #07C160;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.send-btn:hover:not(:disabled) {
  background: #06AD56;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 音量指示器 */
.volume-indicator {
  margin-top: 8px;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
  position: relative;
}

.volume-bar {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #ffeb3b, #f44336);
  transition: width 0.05s linear;
  border-radius: 2px;
}

.volume-text {
  position: absolute;
  right: 0;
  top: -18px;
  font-size: 10px;
  color: #666;
}

/* 浮动模型 */
.floating-model {
  position: fixed;
  top: 100px;
  left: 100px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  z-index: 100;
  cursor: grab;
  transition: box-shadow 0.3s, transform 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.3);
  transform-origin: top left;
}

.floating-model:active {
  cursor: grabbing;
}

.model-controls {
  position: absolute;
  top: -12px;
  right: -12px;
  display: flex;
  gap: 6px;
  z-index: 101;
}

.control-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: white;
  border: 1px solid #e0e0e0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  color: #666;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  font-size: 16px;
  font-weight: bold;
}

.control-btn:hover:not(:disabled) {
  background: #07C160;
  color: white;
  border-color: #07C160;
  transform: scale(1.05);
}

.control-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.control-btn.reset:hover:not(:disabled) {
  background: #f44336;
}

.model-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 12px;
  overflow: hidden;
}

.model-wrapper canvas {
  width: 100%;
  height: 100%;
  display: block;
  cursor: grab;
}

.drag-handle {
  position: absolute;
  bottom: 6px;
  right: 6px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  padding: 3px 6px;
  border-radius: 12px;
  font-size: 8px;
  color: white;
  pointer-events: none;
  opacity: 0.5;
  transition: opacity 0.3s;
}

.model-wrapper:hover .drag-handle {
  opacity: 1;
}

.scale-indicator {
  position: absolute;
  bottom: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  color: white;
  white-space: nowrap;
  pointer-events: none;
  animation: fadeInOut 1s ease;
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
  15% { opacity: 1; transform: translateX(-50%) translateY(0); }
  85% { opacity: 1; transform: translateX(-50%) translateY(0); }
  100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
}

.loading-tip {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: white;
  background: rgba(0, 0, 0, 0.8);
  padding: 12px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  font-size: 12px;
  white-space: nowrap;
  z-index: 103;
}

.spinner {
  width: 30px;
  height: 30px;
  margin: 0 auto 8px;
  border: 2px solid rgba(255, 255, 255, 0.3);
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
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 11px;
  text-align: center;
  max-width: 160px;
  backdrop-filter: blur(5px);
  z-index: 103;
}

.retry-btn {
  margin-top: 8px;
  padding: 4px 10px;
  background: white;
  color: #333;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 10px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .floating-model {
    top: 80px;
    left: 80px;
  }
  
  .control-btn {
    width: 24px;
    height: 24px;
    font-size: 14px;
  }
  
  .message-content {
    max-width: 80%;
  }
  
  .title-text {
    font-size: 16px;
  }
  
  .symptoms-preview {
    grid-template-columns: 1fr;
  }
  
  .voice-select {
    font-size: 10px;
  }
}
</style>