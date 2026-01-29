<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useCommunityStore } from '@/composables/useCommunityStore'

const props = defineProps({
  modelValue: Boolean,
  groupId: Number,
  server: Object
})

const emit = defineEmits(['update:modelValue'])

const store = useCommunityStore()
const { fetchPlayers, kickPlayer, banPlayer } = store

const players = ref([])
const loading = ref(false)
const error = ref(null)

// Context Menu
const showContextMenu = ref(false)
const contextMenuPos = ref({ x: 0, y: 0 })
const selectedPlayer = ref(null)

// Action Dialogs
const showKickConfirm = ref(false)
const showBanDialog = ref(false)
const actionReason = ref('')
const banDuration = ref(0) // minutes

const closeModal = () => {
  emit('update:modelValue', false)
}

const loadPlayers = async () => {
  if (!props.server) return
  loading.value = true
  error.value = null
  players.value = []
  
  const res = await fetchPlayers(props.server.id)
  if (res.success) {
    players.value = res.data
  } else {
    error.value = res.message
  }
  loading.value = false
}

// Right Click Handler
const handleRightClick = (e, player) => {
  e.preventDefault()
  selectedPlayer.value = player
  contextMenuPos.value = { x: e.clientX, y: e.clientY }
  showContextMenu.value = true
}

const closeContextMenu = () => {
  showContextMenu.value = false
}

// Global click listener to close context menu
const onGlobalClick = () => {
  if (showContextMenu.value) closeContextMenu()
}

onMounted(() => {
  if (props.modelValue) loadPlayers()
  window.addEventListener('click', onGlobalClick)
})

onUnmounted(() => {
  window.removeEventListener('click', onGlobalClick)
})

// Kick
const promptKick = () => {
  actionReason.value = 'Kicked by admin'
  showKickConfirm.value = true
}

const confirmKick = async () => {
  if (!selectedPlayer.value) return
  
  await kickPlayer(props.server.id, selectedPlayer.value.userid, actionReason.value)
  showKickConfirm.value = false
  loadPlayers() // Refresh
}

// Ban
const promptBan = () => {
  actionReason.value = 'Banned by admin'
  banDuration.value = 0 // Permanent by default
  showBanDialog.value = true
}

const confirmBan = async () => {
  if (!selectedPlayer.value) return
  
  await banPlayer(props.server.id, selectedPlayer.value.userid, banDuration.value, actionReason.value)
  showBanDialog.value = false
  loadPlayers() // Refresh
}

// Watch for open
import { watch } from 'vue'
watch(() => props.modelValue, (val) => {
  if (val) loadPlayers()
})
</script>

<template>
  <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" @click.self="closeModal">
    <div class="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/50 rounded-t-xl">
        <h3 class="text-xl font-bold text-white flex items-center gap-2">
           <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
           在线玩家 - {{ server?.name }}
        </h3>
        <button @click="closeModal" class="text-slate-400 hover:text-white transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-6 overflow-auto flex-1 min-h-[300px]">
        
        <div v-if="loading" class="flex flex-col items-center justify-center py-12">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
            <p class="text-slate-400">正在查询服务器...</p>
        </div>

        <div v-else-if="error" class="text-center py-12">
            <div class="inline-block p-3 rounded-full bg-red-900/20 text-red-400 mb-4">
               <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            </div>
            <p class="text-red-400 mb-2">{{ error }}</p>
            <button @click="loadPlayers" class="text-sm text-blue-400 hover:text-blue-300 underline">重试</button>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-800 text-xs text-slate-400 bg-slate-800/30 font-mono">
                <th class="p-3">#UserID</th>
                <th class="p-3">Name</th>
                <th class="p-3">SteamID</th>
                <th class="p-3">Time</th>
                <th class="p-3">Ping</th>
              </tr>
            </thead>
            <tbody class="text-sm text-slate-200">
               <tr 
                 v-for="p in players" 
                 :key="p.userid"
                 @contextmenu="handleRightClick($event, p)"
                 class="border-b border-slate-800 hover:bg-slate-800/50 transition-colors cursor-context-menu"
               >
                 <td class="p-3 font-mono text-slate-500">{{ p.userid }}</td>
                 <td class="p-3 font-bold">{{ p.name }}</td>
                 <td class="p-3 font-mono text-xs text-slate-400">{{ p.steam_id }}</td>
                 <td class="p-3 text-slate-400">{{ p.time }}</td>
                 <td class="p-3" :class="p.ping > 100 ? 'text-red-400' : 'text-green-400'">{{ p.ping }}ms</td>
               </tr>
               <tr v-if="players.length === 0">
                 <td colspan="5" class="p-8 text-center text-slate-500 italic">
                   服务器当前没有玩家在线
                 </td>
               </tr>
            </tbody>
          </table>
          
          <div class="mt-4 text-xs text-slate-500 flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            提示：右键点击玩家列表可进行踢出/封禁操作
          </div>
        </div>
      </div>
      
      <div class="px-6 py-4 border-t border-slate-800 bg-slate-800/30 flex justify-end">
        <button @click="closeModal" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors">
          关闭
        </button>
      </div>
    </div>

    <!-- Context Menu -->
    <div 
      v-if="showContextMenu" 
      :style="{ top: contextMenuPos.y + 'px', left: contextMenuPos.x + 'px' }"
      class="fixed z-[60] bg-slate-800 border border-slate-700 shadow-xl rounded-lg py-1 w-48 overflow-hidden transform"
    >
       <div class="px-3 py-2 border-b border-slate-700 text-xs text-slate-400 bg-slate-900/50 truncate font-bold">
         {{ selectedPlayer?.name }}
       </div>
       <button @click="promptKick" class="w-full text-left px-4 py-2 text-sm text-yellow-400 hover:bg-slate-700 flex items-center gap-2">
         <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
         踢出 (Kick)
       </button>
       <button @click="promptBan" class="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2">
         <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
         封禁 (Ban)
       </button>
    </div>

    <!-- Kick Confirm Dialog -->
    <div v-if="showKickConfirm" class="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm">
       <div class="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-sm shadow-2xl">
          <h3 class="text-lg font-bold text-white mb-4">踢出玩家</h3>
          <p class="text-sm text-slate-300 mb-4">
             确定要踢出 <span class="font-bold text-white">{{ selectedPlayer?.name }}</span> 吗？
          </p>
          <div class="mb-4">
            <label class="block text-xs text-slate-400 mb-1">踢出理由 (Reason)</label>
            <input v-model="actionReason" type="text" class="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white focus:border-blue-500 outline-none">
          </div>
          <div class="flex justify-end gap-2">
             <button @click="showKickConfirm = false" class="px-3 py-1.5 text-slate-400 hover:text-white text-sm">取消</button>
             <button @click="confirmKick" class="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-white rounded text-sm font-bold">确定踢出</button>
          </div>
       </div>
    </div>

    <!-- Ban Dialog -->
    <div v-if="showBanDialog" class="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm">
       <div class="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-sm shadow-2xl">
          <h3 class="text-lg font-bold text-white mb-4">封禁玩家</h3>
          <p class="text-sm text-slate-300 mb-4">
             对 <span class="font-bold text-white">{{ selectedPlayer?.name }}</span> 执行封禁
          </p>
          
          <div class="space-y-3 mb-6">
            <div>
              <label class="block text-xs text-slate-400 mb-1">封禁时长 (分钟, 0=永久)</label>
              <input v-model.number="banDuration" type="number" class="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white focus:border-blue-500 outline-none">
              <div class="flex gap-2 mt-1">
                 <button @click="banDuration=0" class="text-xs px-2 py-0.5 bg-slate-800 rounded border border-slate-700 hover:bg-red-900/30 text-red-300">永久</button>
                 <button @click="banDuration=60" class="text-xs px-2 py-0.5 bg-slate-800 rounded border border-slate-700 hover:bg-slate-700 text-slate-300">1小时</button>
                 <button @click="banDuration=1440" class="text-xs px-2 py-0.5 bg-slate-800 rounded border border-slate-700 hover:bg-slate-700 text-slate-300">1天</button>
                 <button @click="banDuration=10080" class="text-xs px-2 py-0.5 bg-slate-800 rounded border border-slate-700 hover:bg-slate-700 text-slate-300">1周</button>
              </div>
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1">封禁理由 (Reason)</label>
              <input v-model="actionReason" type="text" class="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white focus:border-blue-500 outline-none">
            </div>
          </div>
          
          <div class="flex justify-end gap-2">
             <button @click="showBanDialog = false" class="px-3 py-1.5 text-slate-400 hover:text-white text-sm">取消</button>
             <button @click="confirmBan" class="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-sm font-bold">执行封禁</button>
          </div>
       </div>
    </div>
  </div>
</template>
