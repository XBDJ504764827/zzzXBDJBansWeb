<script setup>
import { ref, computed, onMounted } from 'vue'
import { useBanStore } from '../../composables/useBanStore'
import { useAuthStore } from '../../composables/useAuthStore'
import { useCommunityStore } from '../../composables/useCommunityStore'
import BanModal from '../../components/BanModal.vue'

const { bans, addBan, removeBan, updateBan, fetchBans, deleteBanRecord } = useBanStore()
const { currentUser, isSystemAdmin } = useAuthStore()
const { serverGroups, fetchServerGroups } = useCommunityStore()

onMounted(async () => {
    await Promise.all([
        fetchBans(),
        fetchServerGroups()
    ])
})

const getServerName = (serverId) => {
    if (!serverId) return '网页端 / 全局'
    for (const group of serverGroups.value) {
        const server = group.servers.find(s => s.id === serverId)
        if (server) return server.name
    }
    return 'Unknown'
}

const showModal = ref(false)
const editMode = ref(false)
const currentBan = ref({})

const hasBans = computed(() => bans.value.length > 0)

const openAddModal = () => {
    editMode.value = false
    currentBan.value = null
    showModal.value = true
}

const openEditModal = (ban) => {
    editMode.value = true
    currentBan.value = { ...ban }
    showModal.value = true
}

const openRebanModal = (ban) => {
    editMode.value = false // Treat as new ban
    currentBan.value = {
        name: ban.name,
        steamId: ban.steamId,
        ip: ban.ip,
        banType: ban.banType,
        reason: ban.reason,
        duration: '7d' 
    }
    showModal.value = true
}

// "Lift Ban" - Soft delete / Update status
const handleLiftBan = (id) => {
    if (confirm('确定要解除该用户的封禁吗？(将状态设为已解封)')) {
        removeBan(id)
    }
}

// "Hard Delete" - Super Admin Only
const handleHardDelete = (id) => {
    if (confirm('确定要彻底删除这条封禁记录吗？\n警告：这将同时向所有服务器发送解封指令。')) {
        deleteBanRecord(id)
    }
}

const handleSubmit = (formData) => {
    if (editMode.value) {
        if (currentBan.value && currentBan.value.id) {
            updateBan(currentBan.value.id, formData)
        }
    } else {
        // Inject current admin name
        const banData = {
            ...formData,
            adminName: currentUser.value ? currentUser.value.username : 'Unknown'
        }
        addBan(banData)
    }
    showModal.value = false
}

const getStatusColor = (status) => {
    switch (status) {
        case 'active': return 'text-red-400 bg-red-400/10'
        case 'unbanned': return 'text-green-400 bg-green-400/10'
        case 'expired': return 'text-gray-400 bg-gray-400/10'
        default: return 'text-gray-400'
    }
}

const getStatusText = (status) => {
     switch (status) {
        case 'active': return '封禁中'
        case 'unbanned': return '已解封'
        case 'expired': return '已过期'
        default: return status
    }
}
const getBanTypeLabel = (type) => {
    const map = {
        'account': '账号封禁',
        'ip': 'IP封禁',
        'default': '默认',
        'vac': 'VAC',
        'game': 'Game Ban',
        'community': 'Community'
    }
    return map[type] || type
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-white">封禁管理</h1>
        <p class="text-gray-400 text-sm mt-1">管理游戏服务器的玩家封禁记录</p>
      </div>
      <button 
        @click="openAddModal"
        class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all shadow-lg shadow-blue-500/20"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        <span>添加封禁</span>
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="!hasBans" class="flex flex-col items-center justify-center py-20 bg-[#1a1d24] border border-white/5 rounded-xl">
      <div class="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-white mb-1">无封禁玩家</h3>
      <p class="text-gray-400 text-sm">当前没有任何封禁记录</p>
    </div>

    <!-- Ban List -->
    <div v-else class="bg-[#1a1d24] border border-white/5 rounded-xl overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
                <thead>
                    <tr class="border-b border-white/5 bg-white/5">
                        <th class="px-6 py-4 font-medium text-gray-300">玩家</th>
                        <th class="px-6 py-4 font-medium text-gray-300">封禁属性</th>
                        <th class="px-6 py-4 font-medium text-gray-300">封禁时间</th>
                        <th class="px-6 py-4 font-medium text-gray-300">时长 / 解封时间</th>
                        <th class="px-6 py-4 font-medium text-gray-300">来源服务器</th>
                        <th class="px-6 py-4 font-medium text-gray-300">原因</th>
                        <th class="px-6 py-4 font-medium text-gray-300">执行管理</th>
                        <th class="px-6 py-4 font-medium text-gray-300">状态</th>
                        <th class="px-6 py-4 font-medium text-gray-300 text-right">操作</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                    <tr v-for="ban in bans" :key="ban.id" class="hover:bg-white/5 transition-colors">
                        <td class="px-6 py-4">
                            <div class="font-medium text-white">{{ ban.name }}</div>
                            <div class="text-xs text-gray-500 font-mono mt-0.5">{{ ban.steamId }}</div>
                            <div class="text-xs text-gray-600 font-mono" v-if="ban.ip">{{ ban.ip }}</div>
                        </td>
                        <td class="px-6 py-4 text-gray-300">{{ getBanTypeLabel(ban.banType) }}</td>
                        <td class="px-6 py-4 text-gray-400 font-mono text-xs">
                             {{ ban.createTime ? new Date(ban.createTime).toLocaleString() : '-' }}
                        </td>
                        <td class="px-6 py-4">
                             <div class="text-gray-300 text-sm">{{ ban.duration }}</div>
                             <div class="text-xs text-blue-400 font-mono mt-0.5">
                                 {{ ban.expiresAt ? new Date(ban.expiresAt).toLocaleString() : (ban.duration === 'permanent' ? '永久' : '-') }}
                             </div>
                        </td>
                        <td class="px-6 py-4 text-gray-300 text-sm">{{ getServerName(ban.serverId) }}</td>
                        <td class="px-6 py-4 text-gray-300 max-w-xs truncate" :title="ban.reason">{{ ban.reason }}</td>
                        <td class="px-6 py-4 text-blue-400 font-medium">{{ ban.adminName || '-' }}</td>
                        <td class="px-6 py-4">
                            <span :class="['inline-flex items-center px-2 py-1 rounded text-xs font-medium', getStatusColor(ban.status)]">
                                {{ getStatusText(ban.status) }}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-right">
                            <div class="flex items-center justify-end gap-2">
                                <!-- Edit: Only for Active -->
                                <button 
                                    v-if="ban.status === 'active'"
                                    @click="openEditModal(ban)"
                                    class="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                    title="编辑"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                </button>

                                <!-- Re-ban: Only for Expired/Unbanned -->
                                <button 
                                    v-if="ban.status === 'expired' || ban.status === 'unbanned'"
                                    @click="openRebanModal(ban)"
                                    class="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-colors"
                                    title="重新封禁"
                                >
                                     <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
                                     </svg>
                                </button>

                                <!-- Lift Ban (Unlock) -->
                                <button 
                                    v-if="ban.status === 'active'"
                                    @click="handleLiftBan(ban.id)"
                                    class="p-1.5 text-orange-400 hover:text-orange-300 hover:bg-orange-400/10 rounded-lg transition-colors"
                                    title="解除封禁 (Lift Ban)"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 116 0v2h2V7a5 5 0 00-5-5z" />
                                    </svg>
                                </button>

                                <!-- Hard Delete (Trash): Super Admin Only -->
                                <button 
                                    v-if="isSystemAdmin"
                                    @click="handleHardDelete(ban.id)"
                                    class="p-1.5 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="彻底删除 (移除记录并解封)"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                                    </svg>
                                </button>
                             </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <BanModal 
        :show="showModal"
        :edit-mode="editMode"
        :initial-data="currentBan"
        @close="showModal = false"
        @submit="handleSubmit"
    />
  </div>
</template>
