<script setup>
import { ref } from 'vue'
import api from '@/utils/api'

const formData = ref({
  steam_id: '',
  name: ''
})

const submitting = ref(false)
const submitted = ref(false)
const error = ref('')

const checkRateLimit = () => {
  const lastSubmit = localStorage.getItem('last_whitelist_submit')
  if (lastSubmit) {
    const diff = Date.now() - parseInt(lastSubmit)
    if (diff < 10 * 1000) { // 10 seconds
      const remaining = Math.ceil((10 * 1000 - diff) / 1000)
      return `请等待 ${remaining} 秒后再提交`
    }
  }
  return null
}

const handleSubmit = async () => {
  error.value = ''
  
  const limitMsg = checkRateLimit()
  if (limitMsg) {
    error.value = limitMsg
    return
  }

  submitting.value = true
  
  try {
    const res = await api.post('/whitelist/apply', formData.value)
    if (res.status === 201) {
      submitted.value = true
      localStorage.setItem('last_whitelist_submit', Date.now().toString())
    }
  } catch (err) {
    if (err.response?.data?.error) {
       error.value = err.response.data.error
    } else {
      error.value = '提交失败，请稍后重试'
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo/Title -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-white mb-2">白名单申请</h1>
        <p class="text-slate-400">填写您的信息，等待管理员审核</p>
      </div>

      <!-- Warning Alert -->
      <div class="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-yellow-200 text-sm">
        <div class="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-400 mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <div>
              <p class="font-bold mb-1">注意：无需申请的情况</p>
              <p>如果您满足 <span class="text-white font-mono">Rating >= 3.0</span> 并且 <span class="text-white font-mono">Steam等级 >= 1</span>，您可以直接进入服务器，无需申请白名单！</p>
              <p class="mt-1 text-yellow-400/80">只有在无法直接进入服务器时，再填写此申请。</p>
            </div>
        </div>
      </div>

      <!-- Success State -->
      <div v-if="submitted" class="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-green-500/30 p-8 text-center">
        <div class="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </div>
        <h2 class="text-xl font-bold text-white mb-2">申请已提交</h2>
        <p class="text-slate-400">请等待管理员审核，审核通过后您即可进入服务器</p>
      </div>

      <!-- Form -->
      <form v-else @submit.prevent="handleSubmit" class="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-8 space-y-6 shadow-2xl">
        <!-- Error Alert -->
        <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
          {{ error }}
        </div>

        <!-- Steam ID -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Steam ID</label>
          <input 
            v-model="formData.steam_id"
            type="text" 
            required
            placeholder="76561198000000000 或 STEAM_0:0:xxx"
            class="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          >
          <p class="mt-1.5 text-xs text-slate-500">支持 SteamID64、SteamID2、SteamID3 或个人资料链接</p>
        </div>

        <!-- Nickname -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">游戏昵称</label>
          <input 
            v-model="formData.name"
            type="text" 
            required
            placeholder="您在游戏中的昵称"
            class="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          >
        </div>

        <!-- Submit Button -->
        <button 
          type="submit"
          :disabled="submitting"
          class="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-slate-600 disabled:to-slate-600 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:shadow-none"
        >
          <span v-if="submitting" class="flex items-center justify-center gap-2">
            <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            提交中...
          </span>
          <span v-else>提交申请</span>
        </button>
      </form>


    </div>
  </div>
</template>
