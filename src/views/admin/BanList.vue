<script setup>
import { ref, computed, onMounted } from 'vue'
import { useBanStore } from '../../composables/useBanStore'
import { useAuthStore } from '../../composables/useAuthStore'
import { useCommunityStore } from '../../composables/useCommunityStore'
import BanModal from '../../components/BanModal.vue'
import ConfirmModal from '../../components/ConfirmModal.vue'

import { useToast } from '../../composables/useToast'
const { bans, addBan, removeBan, updateBan, fetchBans, deleteBanRecord } = useBanStore()
const { currentUser, isSystemAdmin } = useAuthStore()
const { serverGroups, fetchServerGroups } = useCommunityStore()
const toast = useToast()

onMounted(async () => {
    await Promise.all([
        fetchBans(),
        fetchServerGroups()
    ])
})

// Expanded rows state
const expandedBans = ref([]);

const toggleExpand = (banId) => {
    const index = expandedBans.value.indexOf(banId);
    if (index === -1) {
        expandedBans.value.push(banId);
    } else {
        expandedBans.value.splice(index, 1);
    }
};

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

// Confirm Modal State
const confirmModal = ref({
    show: false,
    title: '',
    content: '',
    type: 'info',
    onConfirm: null
})

const openConfirmModal = (title, content, type, onConfirm) => {
    confirmModal.value = {
        show: true,
        title,
        content,
        type,
        onConfirm
    }
}

const handleConfirm = () => {
    if (confirmModal.value.onConfirm) {
        confirmModal.value.onConfirm()
    }
    confirmModal.value.show = false
}

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
    openConfirmModal(
        '解除封禁确认',
        '确定要解除该用户的封禁吗？(将状态设为已解封)',
        'warning',
        async () => {
            const success = await removeBan(id)
            if (success) {
                toast.success('封禁已解除')
            } else {
                toast.error('解除封禁失败')
            }
        }
    )
}

// "Hard Delete" - Super Admin Only
const handleHardDelete = (id) => {
    openConfirmModal(
        '彻底删除确认',
        '确定要彻底删除这条封禁记录吗？\n警告：这将同时向所有服务器发送解封指令，且记录不可恢复。',
        'danger',
        async () => {
            const success = await deleteBanRecord(id)
            if (success) {
                toast.success('封禁记录已彻底删除')
            } else {
                toast.error('删除失败')
            }
        }
    )
}

const handleSubmit = async (formData) => {
    let res;
    if (editMode.value) {
        if (currentBan.value && currentBan.value.id) {
            res = await updateBan(currentBan.value.id, formData)
            if (res) toast.success('封禁信息更新成功')
            else toast.error('更新失败')
        }
    } else {
        // Inject current admin name
        const banData = {
            ...formData,
            adminName: currentUser.value ? currentUser.value.username : 'Unknown'
        }
        res = await addBan(banData)
        if (res && res.success) toast.success('添加封禁成功')
        else toast.error(res?.message || '添加失败')
    }
    showModal.value = false
}

const getStatusColor = (status) => {
    switch (status) {
        case 'active': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-400/10'
        case 'unbanned': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-400/10'
        case 'expired': return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-400/10'
        default: return 'text-gray-500 dark:text-gray-400'
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
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">封禁管理</h1>
        <p class="text-slate-500 dark:text-gray-400 text-sm mt-1">管理游戏服务器的玩家封禁记录</p>
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
    <div v-if="!hasBans" class="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1a1d24] border border-gray-200 dark:border-white/5 rounded-xl">
      <div class="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-slate-400 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-1">无封禁玩家</h3>
      <p class="text-slate-500 dark:text-gray-400 text-sm">当前没有任何封禁记录</p>
    </div>

    <!-- Ban List -->
    <div v-else class="bg-white dark:bg-[#1a1d24] border border-gray-200 dark:border-white/5 rounded-xl overflow-hidden shadow-sm">
        <div class="overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-300 uppercase tracking-wider">Player Info</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-300 uppercase tracking-wider">IP</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                        <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                    <template v-for="ban in bans" :key="ban.id">
                        <!-- Main Row -->
                        <tr @click="toggleExpand(ban.id)" class="hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer transition-colors duration-150">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-gray-400">#{{ ban.id }}</td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="flex flex-col">
                                    <span class="text-sm font-medium text-slate-900 dark:text-white">{{ ban.name }}</span>
                                    <span class="text-xs text-blue-500 dark:text-blue-400 font-mono">{{ ban.steamId }}</span>
                                    <span v-if="ban.steam_id_3" class="text-xs text-green-600 dark:text-green-400 font-mono">{{ ban.steam_id_3 }}</span>
                                    <span v-if="ban.steam_id_64" class="text-xs text-amber-600 dark:text-yellow-400 font-mono">{{ ban.steam_id_64 }}</span>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-gray-400 font-mono">
                                {{ ban.ip }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="flex items-center space-x-2">
                                    <span :class="getStatusColor(ban.status)" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full border border-gray-100 dark:border-transparent">
                                        {{ getStatusText(ban.status) }}
                                    </span>
                                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                        {{ getBanTypeLabel(ban.banType) }}
                                    </span>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" @click.stop>
                                <div class="flex items-center justify-end gap-2">
                                <!-- Edit: Only for Active -->
                                <button 
                                    v-if="ban.status === 'active'"
                                    @click="openEditModal(ban)"
                                    class="p-1.5 text-slate-400 hover:text-slate-600 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
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
                                    class="p-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-400/10 rounded-lg transition-colors"
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
                                    class="p-1.5 text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-400/10 rounded-lg transition-colors"
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
                                    class="p-1.5 text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="彻底删除 (移除记录并解封)"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                                    </svg>
                                </button>
                             </div>
                        </td>
                    </tr>
                    
                    <!-- Expanded Detail Row -->
                    <tr v-if="expandedBans.includes(ban.id)" class="bg-gray-50 dark:bg-gray-700/30 transition-all duration-200">
                        <td colspan="5" class="px-6 py-4">
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm bg-white dark:bg-[#1a1d24] p-4 rounded-xl border border-gray-200 dark:border-white/5 shadow-inner">
                                <div class="space-y-1">
                                    <span class="block text-xs text-slate-500 dark:text-gray-500 uppercase tracking-wider font-medium">IP 地址</span>
                                    <span class="font-mono text-slate-700 dark:text-gray-200 select-all">{{ ban.ip || 'N/A' }}</span>
                                </div>
                                <div class="space-y-1">
                                    <span class="block text-xs text-slate-500 dark:text-gray-500 uppercase tracking-wider font-medium">来源服务器</span>
                                    <span class="text-slate-700 dark:text-gray-200">{{ getServerName(ban.serverId) }}</span>
                                </div>
                                <div class="space-y-1">
                                    <span class="block text-xs text-slate-500 dark:text-gray-500 uppercase tracking-wider font-medium">执行管理员</span>
                                    <span class="text-blue-600 dark:text-blue-400">{{ ban.adminName || 'System' }}</span>
                                    <span class="text-xs text-slate-500 dark:text-gray-600 block" v-if="ban.createTime">at {{ new Date(ban.createTime).toLocaleString() }}</span>
                                </div>
                                <div class="col-span-1 md:col-span-3 space-y-1">
                                    <span class="block text-xs text-slate-500 dark:text-gray-500 uppercase tracking-wider font-medium">封禁原因</span>
                                    <div class="text-slate-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800/50 p-2 rounded border border-gray-200 dark:border-white/5 break-words">
                                        {{ ban.reason }}
                                    </div>
                                </div>
                                <div class="space-y-1">
                                    <span class="block text-xs text-slate-500 dark:text-gray-500 uppercase tracking-wider font-medium">封禁时长</span>
                                    <span class="text-slate-700 dark:text-gray-200">{{ ban.duration }}</span>
                                </div>
                                <div class="space-y-1">
                                    <span class="block text-xs text-slate-500 dark:text-gray-500 uppercase tracking-wider font-medium">封禁时间</span>
                                    <span class="text-slate-700 dark:text-gray-200 font-mono text-xs">{{ ban.createTime ? new Date(ban.createTime).toLocaleString() : '-' }}</span>
                                </div>
                                <div class="space-y-1">
                                    <span class="block text-xs text-slate-500 dark:text-gray-500 uppercase tracking-wider font-medium">解封时间 / 过期</span>
                                    <span v-if="ban.expiresAt" class="text-amber-600 dark:text-yellow-400 font-mono text-xs">{{ new Date(ban.expiresAt).toLocaleString() }}</span>
                                    <span v-else class="text-slate-500 dark:text-gray-500 text-xs">永久 / 手动解除</span>
                                </div>
                            </div>
                        </td>
                    </tr>
                    </template>
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

    <ConfirmModal 
        :show="confirmModal.show"
        :title="confirmModal.title"
        :content="confirmModal.content"
        :type="confirmModal.type"
        @close="confirmModal.show = false"
        @confirm="handleConfirm"
    />
  </div>
</template>
