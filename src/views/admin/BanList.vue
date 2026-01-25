<script setup>
import { ref, computed } from 'vue'
import { useBanStore } from '../../composables/useBanStore'
import BanModal from '../../components/BanModal.vue'

const { bans, addBan, removeBan, updateBan } = useBanStore()

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

const handleDelete = (id) => {
    if (confirm('确定要解除该用户的封禁吗？')) {
        removeBan(id)
    }
}

const handleSubmit = (formData) => {
    if (editMode.value) {
        if (currentBan.value && currentBan.value.id) {
            updateBan(currentBan.value.id, formData)
        }
    } else {
        addBan(formData)
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
                        <th class="px-6 py-4 font-medium text-gray-300">IP 地址</th>
                        <th class="px-6 py-4 font-medium text-gray-300">原因</th>
                        <th class="px-6 py-4 font-medium text-gray-300">时长</th>
                        <th class="px-6 py-4 font-medium text-gray-300">状态</th>
                        <th class="px-6 py-4 font-medium text-gray-300 text-right">操作</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                    <tr v-for="ban in bans" :key="ban.id" class="hover:bg-white/5 transition-colors">
                        <td class="px-6 py-4">
                            <div class="font-medium text-white">{{ ban.name }}</div>
                            <div class="text-xs text-gray-500 font-mono mt-0.5">{{ ban.steamId }}</div>
                        </td>
                        <td class="px-6 py-4 text-gray-300">{{ ban.banType }}</td>
                        <td class="px-6 py-4 text-gray-400 font-mono">{{ ban.ip }}</td>
                        <td class="px-6 py-4 text-gray-300 max-w-xs truncate" :title="ban.reason">{{ ban.reason }}</td>
                        <td class="px-6 py-4 text-gray-300">{{ ban.duration }}</td>
                        <td class="px-6 py-4">
                            <span :class="['inline-flex items-center px-2 py-1 rounded text-xs font-medium', getStatusColor(ban.status)]">
                                {{ getStatusText(ban.status) }}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-right">
                             <div class="flex items-center justify-end gap-2">
                                <button 
                                    @click="openEditModal(ban)"
                                    class="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                    title="编辑"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                </button>
                                <button 
                                    v-if="ban.status === 'active'"
                                    @click="handleDelete(ban.id)"
                                    class="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                                    title="解除封禁"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
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
