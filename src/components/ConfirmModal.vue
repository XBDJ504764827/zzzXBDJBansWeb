<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: Boolean,
  title: {
    type: String,
    default: '确认操作'
  },
  content: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'info' // 'info', 'warning', 'danger'
  },
  confirmText: {
    type: String,
    default: '确认'
  },
  cancelText: {
    type: String,
    default: '取消'
  }
})

const emit = defineEmits(['close', 'confirm'])

const icon = computed(() => {
  switch (props.type) {
    case 'danger':
      return `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>`
    case 'warning':
      return `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>`
    default: // info
      return `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>`
  }
})

const confirmButtonClass = computed(() => {
  switch (props.type) {
    case 'danger':
      return 'bg-red-600 hover:bg-red-500 focus:ring-red-500'
    case 'warning':
      return 'bg-yellow-600 hover:bg-yellow-500 focus:ring-yellow-500'
    default:
      return 'bg-blue-600 hover:bg-blue-500 focus:ring-blue-500'
  }
})
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" @click="$emit('close')"></div>

    <!-- Modal Panel -->
    <div class="relative bg-white dark:bg-[#1a1d24] rounded-xl border border-gray-200 dark:border-white/10 shadow-2xl w-full max-w-md transform transition-all scale-100 overflow-hidden flex flex-col">
      <div class="p-6">
        <div class="flex items-start gap-4">
          <!-- Icon -->
          <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center" v-html="icon"></div>
          
          <!-- Content -->
          <div class="flex-1">
            <h3 class="text-lg font-medium text-slate-900 dark:text-white leading-6">
              {{ title }}
            </h3>
            <div class="mt-2">
              <p class="text-sm text-slate-500 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
                {{ content }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="bg-gray-50 dark:bg-black/20 px-6 py-4 flex flex-row-reverse gap-3">
        <button 
          type="button" 
          class="inline-flex justify-center rounded-lg border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors"
          :class="confirmButtonClass"
          @click="$emit('confirm')"
        >
          {{ confirmText }}
        </button>
        <button 
          type="button"
          class="inline-flex justify-center rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2 text-sm font-medium text-slate-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors"
          @click="$emit('close')"
        >
          {{ cancelText }}
        </button>
      </div>
    </div>
  </div>
</template>
