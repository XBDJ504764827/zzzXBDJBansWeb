<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { usePlayerRecordStore } from '../../composables/usePlayerRecordStore'
import { useBanStore } from '../../composables/useBanStore'
import { useAuthStore } from '../../composables/useAuthStore'
import BanModal from '../../components/BanModal.vue'

const { records, fetchRecords } = usePlayerRecordStore()
const { addBan } = useBanStore()
const { currentUser } = useAuthStore()

onMounted(() => {
    fetchRecords()
})

const searchQuery = ref('')
const contextMenu = ref({
    visible: false,
    x: 0,
    y: 0,
    record: null
})
const relatedFilter = ref({
    active: false,
    sourceRecord: null
})

// Ban Modal State
const showBanModal = ref(false)
const banInitialData = ref({})

// Context Menu Handlers
const handleRightClick = (event, record) => {
    contextMenu.value = {
        visible: true,
        x: event.clientX,
        y: event.clientY,
        record: record
    }
}

const closeContextMenu = () => {
    contextMenu.value.visible = false
}

const openBanFromContextMenu = () => {
    if (!contextMenu.value.record) return
    const rec = contextMenu.value.record
    banInitialData.value = {
        name: rec.playerName,
        steamId: rec.steamId,
        ip: rec.playerIp,
        banType: 'account', // Default
        duration: '7d'
    }
    showBanModal.value = true
    closeContextMenu()
}

const handleBanSubmit = (formData) => {
    const banData = {
        ...formData,
        adminName: currentUser.value ? currentUser.value.username : 'Unknown'
    }
    addBan(banData)
    showBanModal.value = false
    alert('封禁已添加')
}

// Related Records Logic
const showRelatedRecords = () => {
    if (!contextMenu.value.record) return
    relatedFilter.value = {
        active: true,
        sourceRecord: contextMenu.value.record
    }
    searchQuery.value = '' // Clear text search to show relations
    closeContextMenu()
}

const clearRelatedFilter = () => {
    relatedFilter.value = {
        active: false,
        sourceRecord: null
    }
}

const getMatchReasons = (record) => {
    if (!relatedFilter.value.active || !relatedFilter.value.sourceRecord) return []
    
    const source = relatedFilter.value.sourceRecord
    const reasons = []
    
    if (record.playerName === source.playerName) reasons.push('同名')
    if (record.steamId === source.steamId) reasons.push('同SteamID')
    if (record.playerIp === source.playerIp) reasons.push('同IP')
    
    return reasons
}

const filteredRecords = computed(() => {
    // If related filter is active, prioritize it
    if (relatedFilter.value.active && relatedFilter.value.sourceRecord) {
        const source = relatedFilter.value.sourceRecord
        return records.value.filter(record => {
            return (
                record.playerName === source.playerName ||
                record.steamId === source.steamId ||
                record.playerIp === source.playerIp
            )
        })
    }

    if (!searchQuery.value) return records.value
    
    const query = searchQuery.value.toLowerCase()
    return records.value.filter(record => {
        const timeStr = new Date(record.connectTime).toLocaleString().toLowerCase()
        return (
            record.playerName.toLowerCase().includes(query) ||
            record.steamId.toLowerCase().includes(query) ||
            record.playerIp.includes(query) ||
            record.serverName.toLowerCase().includes(query) ||
            timeStr.includes(query)
        )
    })
})

// Global click listener to close menu
onMounted(() => window.addEventListener('click', closeContextMenu))
onUnmounted(() => window.removeEventListener('click', closeContextMenu))
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-end">
      <div>
        <h1 class="text-2xl font-bold text-white">玩家记录</h1>
        <p class="text-gray-400 text-sm mt-1">查看玩家进入服务器的历史记录</p>
      </div>
      
      <!-- Search / Filter Info -->
      <div class="w-full max-w-md">
          <div v-if="relatedFilter.active" class="flex items-center gap-4 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-lg">
              <span class="text-sm text-blue-300">
                  正在查看与 <strong>{{ relatedFilter.sourceRecord.playerName }}</strong> 关联的记录
              </span>
              <button @click="clearRelatedFilter" class="text-xs text-white bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded transition-colors">
                  清除筛选
              </button>
          </div>
          <div v-else class="relative">
             <input 
                v-model="searchQuery"
                type="text"
                class="w-full bg-[#1a1d24] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="搜索名称 / SteamID / IP / 服务器 / 时间..."
             >
             <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
             </svg>
          </div>
      </div>
    </div>

    <!-- Records List -->
    <div class="bg-[#1a1d24] border border-white/5 rounded-xl overflow-hidden min-h-[400px]">
        <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
                <thead>
                    <tr class="border-b border-white/5 bg-white/5">
                        <th class="px-6 py-4 font-medium text-gray-300">连接时间</th>
                        <th class="px-6 py-4 font-medium text-gray-300">玩家名称</th>
                        <th class="px-6 py-4 font-medium text-gray-300">SteamID</th>
                        <th class="px-6 py-4 font-medium text-gray-300">玩家 IP</th>
                        <th class="px-6 py-4 font-medium text-gray-300">服务器名称</th>
                        <th class="px-6 py-4 font-medium text-gray-300">服务器地址</th>
                        <th v-if="relatedFilter.active" class="px-6 py-4 font-medium text-blue-400">匹配原因</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                    <tr v-if="filteredRecords.length === 0">
                        <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                            未找到匹配的记录
                        </td>
                    </tr>
                    <tr 
                        v-for="record in filteredRecords" 
                        :key="record.id" 
                        class="hover:bg-white/5 transition-colors cursor-context-menu"
                        @contextmenu.prevent="handleRightClick($event, record)"
                    >
                        <td class="px-6 py-4 text-gray-400 font-mono text-xs">
                            {{ new Date(record.connectTime).toLocaleString() }}
                        </td>
                        <td class="px-6 py-4 font-medium text-white">
                            {{ record.playerName }}
                        </td>
                        <td class="px-6 py-4 text-gray-400 font-mono">
                            {{ record.steamId }}
                        </td>
                        <td class="px-6 py-4 text-gray-400 font-mono">
                             {{ record.playerIp }}
                        </td>
                        <td class="px-6 py-4 text-blue-300">
                             {{ record.serverName }}
                        </td>
                        <td class="px-6 py-4 text-gray-500 font-mono text-xs">
                             {{ record.serverAddress }}
                        </td>
                        <td v-if="relatedFilter.active" class="px-6 py-4 text-xs">
                             <div class="flex flex-wrap gap-1">
                                 <span 
                                    v-for="reason in getMatchReasons(record)" 
                                    :key="reason"
                                    class="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                 >
                                     {{ reason }}
                                 </span>
                             </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Context Menu -->
    <div 
        v-if="contextMenu.visible"
        :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
        class="fixed z-50 w-48 bg-[#1e222b] border border-white/10 rounded-lg shadow-xl py-1 overflow-hidden"
    >
        <button 
            @click="openBanFromContextMenu"
            class="w-full text-left px-4 py-2 text-sm text-white hover:bg-blue-600 hover:text-white transition-colors flex items-center gap-2"
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
            </svg>
            封禁该玩家
        </button>
        <button 
            @click="showRelatedRecords"
            class="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
            </svg>
            查看所有记录
        </button>
    </div>

    <!-- Ban Modal Integration -->
    <BanModal 
        :show="showBanModal"
        :edit-mode="false"
        :initial-data="banInitialData"
        @close="showBanModal = false"
        @submit="handleBanSubmit"
    />
  </div>
</template>
