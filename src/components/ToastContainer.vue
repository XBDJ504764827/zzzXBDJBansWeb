<script setup>
import { useToast } from '@/composables/useToast'
import Toast from '@/components/Toast.vue'

const { toasts, remove } = useToast()
</script>

<template>
  <div class="fixed top-20 right-4 z-[9999] flex flex-col items-end gap-2 pointer-events-none">
    <TransitionGroup 
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform translate-x-full opacity-0"
      enter-to-class="transform translate-x-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform translate-x-0 opacity-100"
      leave-to-class="transform translate-x-full opacity-0"
    >
      <Toast
        v-for="toast in toasts"
        :key="toast.id"
        v-bind="toast"
        @close="remove(toast.id)"
      />
    </TransitionGroup>
  </div>
</template>
