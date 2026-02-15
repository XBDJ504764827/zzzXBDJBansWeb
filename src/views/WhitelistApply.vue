<script setup>
import { ref, watch, computed } from 'vue'
import api from '@/utils/api'
import { debounce } from 'lodash-es'

const formData = ref({
  steam_id: '',
  name: ''
})

const submitting = ref(false)
const submitted = ref(false)
const error = ref('')

// Player check state
const checkingPlayer = ref(false)
const playerInfo = ref(null)
const playerCheckError = ref('')
const confirmationStatus = ref('none') // 'none', 'pending', 'confirmed_me', 'confirmed_other'

const isNameDisabled = computed(() => {
  // Disabled if:
  // 1. Checking player info
  // 2. Player info found but not confirmed yet
  // 3. Confirmed as "Me" (Auto-filled and locked)
  // Enabled only if:
  // 1. Confirmed as "Not Me" (Manual entry)
  // 2. Or maybe if no Steam ID entered yet? (But user said "When querying... is not fillable")
  // Let's stick to: Disabled unless 'confirmed_other'
  return confirmationStatus.value !== 'confirmed_other'
})

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

const checkPlayer = async (val) => {
  if (!val) {
    playerInfo.value = null
    playerCheckError.value = ''
    confirmationStatus.value = 'none'
    formData.value.name = ''
    return
  }
  
  if (val.length < 5) return

  checkingPlayer.value = true
  playerCheckError.value = ''
  playerInfo.value = null
  confirmationStatus.value = 'none'
  formData.value.name = '' // Clear name on new search
  
  try {
    const res = await api.get('/whitelist/player-info', {
      params: { steam_id: val }
    })
    playerInfo.value = res.data
    confirmationStatus.value = 'pending'
  } catch (err) {
    if (err.response?.status === 404) {
       playerCheckError.value = '未找到玩家，请检查 Steam ID'
    } else {
       console.error(err)
    }
  } finally {
    checkingPlayer.value = false
  }
}

const confirmIsMe = () => {
  if (playerInfo.value) {
    formData.value.name = playerInfo.value.personaname
    confirmationStatus.value = 'confirmed_me'
  }
}

const confirmNotMe = () => {
  formData.value.name = ''
  confirmationStatus.value = 'confirmed_other'
}

// Debounce the check
const debouncedCheck = debounce(checkPlayer, 800)

watch(() => formData.value.steam_id, (val) => {
  debouncedCheck(val)
})

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
  <div class="min-h-screen bg-gray-100 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
    <div class="w-full max-w-md">
      <!-- Logo/Title -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-2">白名单申请</h1>
        <p class="text-slate-600 dark:text-slate-400">填写您的信息，等待管理员审核</p>
      </div>

      <!-- Warning Alert -->
      <div class="mb-6 bg-yellow-50 border border-yellow-200 dark:bg-yellow-500/10 dark:border-yellow-500/30 rounded-lg p-4 text-yellow-800 dark:text-yellow-200 text-sm">
        <div class="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-500 dark:text-yellow-400 mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <div>
              <p class="font-bold mb-1">注意：无需申请的情况</p>
              <p>如果您满足 <span class="font-bold font-mono">Rating >= 3.0</span> 并且 <span class="font-bold font-mono">Steam等级 >= 1</span>，您可以直接进入服务器，无需申请白名单！</p>
              <p class="mt-1 opacity-80">只有在无法直接进入服务器时，再填写此申请。</p>
            </div>
        </div>
      </div>

      <!-- Success State -->
      <div v-if="submitted" class="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-green-200 dark:border-green-500/30 p-8 text-center shadow-xl">
        <div class="w-16 h-16 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </div>
        <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-2">申请已提交</h2>
        <p class="text-slate-600 dark:text-slate-400">请等待管理员审核，审核通过后您即可进入服务器</p>
      </div>

      <!-- Form -->
      <form v-else @submit.prevent="handleSubmit" class="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-slate-800/50 p-8 space-y-6 shadow-xl transition-colors">
        <!-- Error Alert -->
        <div v-if="error" class="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg p-4 text-red-600 dark:text-red-400 text-sm">
          {{ error }}
        </div>

        <!-- Steam ID -->
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Steam ID</label>
          <div class="relative">
             <input 
              v-model="formData.steam_id"
              type="text" 
              required
              placeholder="76561198000000000 或 STEAM_0:0:xxx"
              class="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all pr-10"
              :class="{'border-red-500': playerCheckError, 'border-green-500': confirmationStatus === 'pending' || confirmationStatus.startsWith('confirmed')}"
            >
             <div class="absolute right-3 top-1/2 -translate-y-1/2">
                <svg v-if="checkingPlayer" class="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
             </div>
          </div>
          
          <p v-if="playerCheckError" class="mt-1.5 text-xs text-red-500 dark:text-red-400">{{ playerCheckError }}</p>
          <p v-else class="mt-1.5 text-xs text-slate-500">支持 SteamID64、SteamID2、SteamID3 或个人资料链接</p>
          
          <!-- Player Confirmation -->
          <div v-if="playerInfo" class="mt-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-2">
              <div class="flex items-center gap-3 mb-3">
                <img :src="playerInfo.avatarfull" class="w-12 h-12 rounded-full border border-slate-300 dark:border-slate-600" alt="Avatar">
                <div class="flex-1 min-w-0">
                    <p class="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">检测到玩家</p>
                    <p class="text-lg font-bold text-slate-900 dark:text-white truncate">{{ playerInfo.personaname }}</p>
                </div>
              </div>

              <!-- Confirmation Buttons -->
              <div v-if="confirmationStatus === 'pending'" class="flex gap-3">
                  <button type="button" @click="confirmIsMe" class="flex-1 bg-green-100 hover:bg-green-200 dark:bg-green-600/20 dark:hover:bg-green-600/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-600/50 py-2 rounded-lg text-sm font-medium transition-colors">
                      是本人
                  </button>
                  <button type="button" @click="confirmNotMe" class="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700/50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 py-2 rounded-lg text-sm font-medium transition-colors">
                      不是本人
                  </button>
              </div>

              <!-- Status Display -->
              <div v-else-if="confirmationStatus === 'confirmed_me'" class="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-3 py-2 rounded-lg text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                  <span>已确认为本人</span>
                  <button type="button" @click="checkPlayer(formData.steam_id)" class="ml-auto text-xs underline opacity-75 hover:opacity-100">重选</button>
              </div>
              <div v-else-if="confirmationStatus === 'confirmed_other'" class="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-500/10 px-3 py-2 rounded-lg text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                  </svg>
                  <span>请修改您的信息或手动填写昵称</span>
                  <button type="button" @click="checkPlayer(formData.steam_id)" class="ml-auto text-xs underline opacity-75 hover:opacity-100">重选</button>
              </div>
          </div>
        </div>

        <!-- Nickname -->
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">游戏昵称</label>
          <input 
            v-model="formData.name"
            type="text" 
            required
            :disabled="isNameDisabled"
            placeholder="您在游戏中的昵称"
            class="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
          <p class="mt-1.5 text-xs text-slate-500">
             <span v-if="confirmationStatus === 'none'">请先填写 Steam ID</span>
             <span v-else-if="confirmationStatus === 'pending'">请确认是否为本人</span>
             <span v-else-if="confirmationStatus === 'confirmed_me'">已自动填写 Steam 昵称</span>
             <span v-else>请手动填写游戏昵称</span>
          </p>
        </div>

        <!-- Submit Button -->
        <button 
          type="submit"
          :disabled="submitting || confirmationStatus === 'none' || confirmationStatus === 'pending'"
          class="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:shadow-none"
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

        <div class="text-center mt-4">
          <router-link to="/whitelist-status" class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
            已提交申请？点击查看审核状态 &rarr;
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>


