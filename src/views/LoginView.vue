<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../composables/useAuthStore'

const router = useRouter()
  const { login } = useAuthStore()
  
  const username = ref('')
  const password = ref('')
  const loading = ref(false)
  const error = ref('')
  
  const handleLogin = async () => {
    error.value = ''
    
    if (!username.value || !password.value) {
      error.value = '请输入用户名和密码'
      return
    }
  
    loading.value = true
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const result = await login(username.value, password.value)
    
    loading.value = false
    
    if (result.success) {
         console.log('Login successful', result.user)
         router.push('/admin')
    } else {
         error.value = result.message
    }
  }
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-950 p-4">
    <div class="w-full max-w-md bg-slate-900 rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
      <!-- Header -->
      <div class="px-8 py-10 bg-gradient-to-b from-slate-900 to-slate-800/50">
        <h1 class="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
          zzzXBDJBans
        </h1>
        <p class="mt-2 text-center text-slate-400 text-sm">
          管理平台登录入口
        </p>
      </div>

      <!-- Form -->
      <div class="px-8 py-8 space-y-6">
        <div v-if="error" class="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400 text-center">
          {{ error }}
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div class="space-y-2">
            <label for="username" class="text-sm font-medium text-slate-300">用户名</label>
            <input 
              id="username"
              v-model="username"
              type="text" 
              class="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="请输入管理员账号"
            />
          </div>

          <div class="space-y-2">
            <label for="password" class="text-sm font-medium text-slate-300">密码</label>
            <input 
              id="password"
              v-model="password"
              type="password" 
              class="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            :disabled="loading"
            class="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <span v-if="!loading">登 录</span>
            <svg v-else class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </button>
        </form>
      </div>
      
      <!-- Footer -->
      <div class="px-8 py-4 bg-slate-950/50 border-t border-slate-800/50 text-center">
         <p class="text-xs text-slate-500 font-mono">
           System Status: <span class="text-green-500">Online</span>
         </p>
      </div>
    </div>
  </div>
</template>
