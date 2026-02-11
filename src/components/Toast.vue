<script setup>
import { onMounted, onUnmounted } from 'vue'

const props = defineProps({
  id: String,
  title: String,
  message: String,
  type: {
    type: String,
    default: 'info' // success, error, warning, info
  },
  duration: {
    type: Number,
    default: 3000
  }
})

const emit = defineEmits(['close'])

let timer = null

const startTimer = () => {
  if (props.duration > 0) {
    timer = setTimeout(() => {
      emit('close')
    }, props.duration)
  }
}

const stopTimer = () => {
  if (timer) clearTimeout(timer)
}

onMounted(() => {
  startTimer()
})

onUnmounted(() => {
  stopTimer()
})

const getTypeStyles = () => {
  switch (props.type) {
    case 'success':
      return 'border-l-4 border-green-500 bg-[#1a1d24] text-white shadow-lg shadow-green-900/20'
    case 'error':
      return 'border-l-4 border-red-500 bg-[#1a1d24] text-white shadow-lg shadow-red-900/20'
    case 'warning':
      return 'border-l-4 border-yellow-500 bg-[#1a1d24] text-white shadow-lg shadow-yellow-900/20'
    default:
      return 'border-l-4 border-blue-500 bg-[#1a1d24] text-white shadow-lg shadow-blue-900/20'
  }
}

const getIcon = () => {
    switch (props.type) {
        case 'success': return '✓'
        case 'error': return '✕'
        case 'warning': return '!'
        default: return 'i'
    }
}
</script>

<template>
  <div 
    class="flex items-start p-4 mb-3 rounded-r-lg min-w-[300px] pointer-events-auto transform transition-all duration-300 hover:scale-[1.02] border border-white/5 backdrop-blur-sm"
    :class="getTypeStyles()"
    @mouseenter="stopTimer"
    @mouseleave="startTimer"
  >
    <div class="flex-shrink-0 mr-3 mt-0.5">
        <div class="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
            :class="{
                'bg-green-500/20 text-green-400': type === 'success',
                'bg-red-500/20 text-red-400': type === 'error',
                'bg-yellow-500/20 text-yellow-400': type === 'warning',
                'bg-blue-500/20 text-blue-400': type === 'info'
            }"
        >
            {{ getIcon() }}
        </div>
    </div>
    <div class="flex-1 mr-2">
      <h4 v-if="title" class="text-sm font-semibold mb-0.5">{{ title }}</h4>
      <p class="text-sm opacity-90 leading-tight">{{ message }}</p>
    </div>
    <button @click="$emit('close')" class="flex-shrink-0 text-gray-400 hover:text-white transition-colors">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
    </button>
  </div>
</template>
