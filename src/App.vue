<script setup>
import { useAuthStore } from './composables/useAuthStore'
import ToastContainer from '@/components/ToastContainer.vue'

const authStore = useAuthStore()
authStore.checkAuth()
</script>

<template>
  <router-view></router-view>
  <ToastContainer />
</template>
