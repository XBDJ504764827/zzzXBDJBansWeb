<script setup>
import { useAuthStore } from './composables/useAuthStore'

const authStore = useAuthStore()
authStore.checkAuth()
</script>

<template>
  <router-view></router-view>
</template>
