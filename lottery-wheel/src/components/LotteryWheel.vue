<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'

const props = defineProps<{
  prizes: string[]
  isSpinning: boolean
  presetResult?: string
}>()

const emit = defineEmits<{
  (e: 'spin-end', prize: string): void
}>()

// 转盘相关参数
const canvasRef = ref<HTMLCanvasElement | null>(null)
const wheelRadius = ref(200)
const rotationAngle = ref(0)
const spinDuration = ref(5000) // 旋转持续时间（毫秒）
const spinningClass = ref('')
const colors = ['#FFC107', '#FF9800', '#FF5722', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3']

// 计算每个奖项的角度
const sectorAngle = computed(() => 360 / props.prizes.length)

// 绘制转盘
const drawWheel = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  // 设置画布尺寸
  const size = wheelRadius.value * 2
  canvas.width = size
  canvas.height = size
  
  // 清除画布
  ctx.clearRect(0, 0, size, size)
  
  // 绘制扇形和文字
  const centerX = size / 2
  const centerY = size / 2
  const radius = wheelRadius.value - 10 // 留出一些边距
  
  for (let i = 0; i < props.prizes.length; i++) {
    const startAngle = (i * sectorAngle.value) * (Math.PI / 180)
    const endAngle = ((i + 1) * sectorAngle.value) * (Math.PI / 180)
    
    // 绘制扇形
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.arc(centerX, centerY, radius, startAngle, endAngle)
    ctx.closePath()
    
    // 填充颜色
    ctx.fillStyle = colors[i % colors.length]
    ctx.fill()
    
    // 绘制边框
    ctx.lineWidth = 1
    ctx.strokeStyle = 'white'
    ctx.stroke()
    
    // 绘制文字
    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate(startAngle + sectorAngle.value / 2 * (Math.PI / 180))
    
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = 'white'
    ctx.font = 'bold 16px Arial'
    
    // 计算文字位置（距离圆心3/4半径的位置）
    const textRadius = radius * 0.75
    ctx.fillText(props.prizes[i], textRadius, 0)
    
    ctx.restore()
  }
  
  // 绘制中心圆
  ctx.beginPath()
  ctx.arc(centerX, centerY, 20, 0, Math.PI * 2)
  ctx.fillStyle = 'white'
  ctx.fill()
  ctx.lineWidth = 2
  ctx.strokeStyle = '#e67e22'
  ctx.stroke()
}

// 开始旋转
const startSpin = () => {
  let selectedPrize: string;
  let randomIndex: number;
  
  // 如果提供了预设结果，使用它；否则，随机选择一个奖项
  if (props.presetResult && props.prizes.includes(props.presetResult)) {
    selectedPrize = props.presetResult;
    randomIndex = props.prizes.indexOf(selectedPrize);
  } else {
    randomIndex = Math.floor(Math.random() * props.prizes.length);
    selectedPrize = props.prizes[randomIndex];
  }
  
  // 计算最终角度
  const baseAngle = 360 * 5 // 基础旋转5圈
  // 注意：转盘旋转后，指针指向的是转盘旋转方向的反方向
  // 因此需要用总数减去索引，再加上适当的偏移确保指针指向奖品中心
  // 添加90度偏移，使起点逆时针旋转90度
  const targetAngle = 360 - (randomIndex * sectorAngle.value) - (sectorAngle.value / 2) + 90
  // 在原有基础上增加180度的旋转角度
  const finalAngle = baseAngle + targetAngle + 180
  
  // 动画参数
  const startTime = Date.now()
  const duration = spinDuration.value
  let currentRotation = 0
  
  // 动画函数
  const animate = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    if (progress < 1) {
      // 持续旋转阶段
      currentRotation = 360 * 5 * progress // 5圈旋转
      rotationAngle.value = currentRotation
      spinningClass.value = 'spinning'
      requestAnimationFrame(animate)
    } else {
      // 最终定位阶段
      rotationAngle.value = finalAngle
      spinningClass.value = 'final-spin'
      
      // 旋转结束后触发事件
      setTimeout(() => {
        emit('spin-end', selectedPrize)
        spinningClass.value = ''
      }, 1000)
    }
  }
  
  // 开始动画
  requestAnimationFrame(animate)
}

// 监听 isSpinning 变化
watch(() => props.isSpinning, (newVal, oldVal) => {
  if (newVal && !oldVal) {
    startSpin()
  }
})

// 组件挂载后初始化
onMounted(() => {
  drawWheel()
  
  // 响应窗口大小变化
  window.addEventListener('resize', () => {
    // 根据容器宽度调整转盘大小
    const container = canvasRef.value?.parentElement
    if (container) {
      const containerWidth = container.clientWidth
      wheelRadius.value = Math.min(200, containerWidth / 2 - 20)
      drawWheel()
    //   drawPointer()
    }
  })
  
  // 初始触发一次 resize 事件以适应当前窗口大小
  window.dispatchEvent(new Event('resize'))
})
</script>

<template>
  <div class="lottery-wheel">
    <div class="wheel-wrapper">
      <div 
        class="wheel" 
        :class="spinningClass" 
        :style="{ transform: `rotate(${rotationAngle}deg)` }"
      >
        <canvas ref="canvasRef"></canvas>
      </div>
      <div class="pointer"></div>
    </div>
  </div>
</template>

<style scoped>
.lottery-wheel {
  width: 100%;
  position: relative;
}

.wheel-wrapper {
  position: relative;
  width: 100%;
  padding-top: 100%; /* 保持1:1的宽高比 */
}

.wheel {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  transform-origin: center;
  transition: transform 0.2s ease;
}

.wheel.spinning {
  transition: transform 0.1s linear;
}

.wheel.final-spin {
  transition: transform 1s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.pointer {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 20px solid transparent;
  border-right: 20px solid transparent;
  border-top: 40px solid #e67e22;
  z-index: 10;
  filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.3));
}

canvas {
  max-width: 100%;
  max-height: 100%;
}
</style>