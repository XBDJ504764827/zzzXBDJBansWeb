<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../composables/useAuthStore'
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const { login } = useAuthStore()
  
const username = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
    error.value = ''
    
    if (!username.value || !password.value) {
      error.value = '请输入用户名和密码'
      return
    }
  
    loading.value = true
    
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
  <div class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-950 p-4 transition-colors duration-300">
    <div class="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all duration-300">
      <!-- Header -->
      <div class="px-8 py-10 bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800/50">
        <h1 class="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
          zzzXBDJBans
        </h1>
        <p class="mt-2 text-center text-slate-400 text-sm">
          管理平台登录入口
        </p>
      </div>

      <!-- Form -->
      <div class="px-8 py-8 space-y-6">
        <div v-if="error" class="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400 text-center flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          {{ error }}
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div class="space-y-2">
            <label for="username" class="text-sm font-medium text-slate-700 dark:text-slate-300">用户名</label>
            <input 
              id="username"
              v-model="username"
              type="text" 
              class="w-full px-4 py-3 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="请输入管理员账号"
            />
          </div>

          <div class="space-y-2">
            <label for="password" class="text-sm font-medium text-slate-700 dark:text-slate-300">密码</label>
            <div class="relative">
                <input 
                  id="password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  class="w-full px-4 py-3 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors pr-10"
                  placeholder="••••••••"
                />
                <button 
                  type="button" 
                  @click="showPassword = !showPassword"
                  class="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
                >
                  <EyeIcon v-if="!showPassword" class="h-5 w-5" />
                  <EyeSlashIcon v-else class="h-5 w-5" />
                </button>
            </div>
          </div>

          <button 
            type="submit" 
            :disabled="loading"
            class="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-blue-600/20"
          >
            <span v-if="!loading">登 录</span>
            <svg v-else class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </button>

          <div class="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-200 dark:border-slate-800/50">
              <router-link to="/apply" class="text-sm font-medium text-slate-500 hover:text-indigo-400 transition-colors">
                  申请白名单
              </router-link>
               <router-link to="/whitelist-status" class="text-sm font-medium text-slate-500 hover:text-indigo-400 transition-colors">
                  进度查询
              </router-link>
              <router-link to="/bans" class="text-sm font-medium text-slate-500 hover:text-rose-400 transition-colors flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                  封禁公示
              </router-link>
          </div>
        </form>
      </div>
      
      <!-- Footer -->
      <div class="px-8 py-4 bg-gray-50 dark:bg-slate-950/50 border-t border-gray-200 dark:border-slate-800/50 text-center">
         <p class="text-xs text-slate-500 font-mono">
           System Status: <span class="text-green-500">Online</span>
         </p>
      </div>
    </div>
  </div>
</template>
