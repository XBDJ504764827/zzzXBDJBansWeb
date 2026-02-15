<script setup>
import { ref } from 'vue'
import { useCommunityStore } from '@/composables/useCommunityStore'
import ServerGroupModal from '@/components/ServerGroupModal.vue'
import ServerEditModal from '@/components/ServerEditModal.vue'

import ServerPlayersModal from '@/components/ServerPlayersModal.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'

import { onMounted } from 'vue'

import { useToast } from '@/composables/useToast'

const store = useCommunityStore()
const { serverGroups, hasCommunity, removeServerGroup, removeServer, fetchServerGroups } = store
const toast = useToast()

onMounted(() => {
    fetchServerGroups()
})

const showGroupModal = ref(false)
const showServerModal = ref(false)
const showPlayersModal = ref(false)

// Confirm Modal Logic
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

const currentEditingGroup = ref(null) // ID of group being edited/added to
const currentEditingServer = ref(null) // Server object if editing, null if adding
const currentViewingServer = ref(null) // Server object for viewing players

// --- Group Actions ---
const openCreateGroupModal = () => {
  currentEditingGroup.value = null
  showGroupModal.value = true
}

// --- Server Actions ---
const openAddServerModal = (groupId) => {
  currentEditingGroup.value = groupId
  currentEditingServer.value = null
  showServerModal.value = true
}

const openEditServerModal = (groupId, server) => {
  currentEditingGroup.value = groupId
  // Clone to avoid direct mutation before save
  currentEditingServer.value = { ...server }
  showServerModal.value = true
}

const openPlayersModal = (server) => {
  currentViewingServer.value = server
  showPlayersModal.value = true
}

const handleDeleteServer = async (groupId, serverId) => {
  openConfirmModal(
    '删除服务器',
    '确定要删除这个服务器吗？',
    'danger',
    async () => {
        const res = await removeServer(groupId, serverId)
        if (res.success) {
            toast.success('服务器已删除')
        } else {
            toast.error(res.message)
        }
    }
  )
}

const handleDeleteGroup = (groupId) => {
  openConfirmModal(
    '删除服务器组',
    '确定要删除这个服务器组吗？组内所有服务器也将被删除。',
    'danger',
    async () => {
        const res = await removeServerGroup(groupId)
        if (res.success) {
            toast.success('服务器组已删除')
        } else {
            toast.error(res.message)
        }
    }
  )
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header Area -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-slate-900 dark:text-white">社区组管理</h2>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">管理您的服务器分组与具体实例</p>
      </div>
      <button 
        v-if="hasCommunity"
        @click="openCreateGroupModal"
        class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        新建服务器组
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="!hasCommunity" class="mt-20 flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-gray-300 dark:border-slate-800 rounded-2xl bg-gray-50 dark:bg-slate-900/50">
      <div class="h-20 w-20 bg-gray-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
        <svg class="w-10 h-10 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
        </svg>
      </div>
      <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">暂无服务器组</h3>
      <p class="text-slate-500 dark:text-slate-400 max-w-md mb-8">
        您还没有创建任何社区组。创建一个组来开始添加和管理您的游戏服务器。
      </p>
      <button 
        @click="openCreateGroupModal"
        class="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all hover:scale-105"
      >
        开始创建
      </button>
    </div>

    <!-- Content List -->
    <div v-else class="grid gap-6">
      <div 
        v-for="group in serverGroups" 
        :key="group.id" 
        class="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm"
      >
        <!-- Group Header -->
        <div class="px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/30 flex items-center justify-between">
          <div class="flex items-center gap-3">
             <div class="h-8 w-1 bg-blue-500 rounded-full"></div>
             <h3 class="text-lg font-bold text-slate-800 dark:text-white">{{ group.name }}</h3>
             <span class="text-xs px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700">ID: {{ group.id }}</span>
          </div>
          <div class="flex items-center gap-2">
            <button 
              @click="openAddServerModal(group.id)"
              class="text-sm px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 rounded transition-colors border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 flex items-center gap-1"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              添加服务器
            </button>
            <button 
              @click="handleDeleteGroup(group.id)"
              class="text-sm px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 rounded transition-colors border border-gray-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800"
            >
              删除组
            </button>
          </div>
        </div>

        <!-- Server List -->
        <div class="p-6">
          <div v-if="group.servers.length === 0" class="text-center py-8 text-slate-500 text-sm italic">
            该组下暂无服务器，请点击右上角添加
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div 
              v-for="server in group.servers" 
              :key="server.id"
              class="bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg p-4 hover:border-blue-300 dark:hover:border-slate-700 transition-colors group/card relative"
            >
               <!-- Server Status Indicator -->
               <div class="absolute top-4 right-4 flex gap-2">
                  <!-- Verification Status -->
                  <div class="flex items-center gap-1 bg-white dark:bg-slate-900/80 px-2 py-0.5 rounded text-[10px] font-mono border border-gray-200 dark:border-slate-800" :class="server.verification_enabled ? 'text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/30' : 'text-slate-400 dark:text-slate-500'">
                     <span v-if="server.verification_enabled">🛡️ 验证开启</span>
                     <span v-else>🛡️ 验证关闭</span>
                  </div>

                  <!-- Online Status -->
                  <div class="flex h-3 w-3 mt-1 relative">
                    <span v-if="server.status === 'online'" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span :class="server.status === 'online' ? 'bg-green-500' : 'bg-red-500'" class="relative inline-flex rounded-full h-3 w-3"></span>
                  </div>
               </div>

               <h4 class="font-bold text-slate-800 dark:text-slate-200 mb-1 pr-6 truncate">{{ server.name }}</h4>
               <div class="flex items-center gap-2 mb-2">
                 <span class="text-[10px] px-2 py-0.5 rounded bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-gray-200 dark:border-slate-800 font-mono">ID: {{ server.id }}</span>
               </div>
               <div class="text-xs font-mono text-slate-500 mb-4">{{ server.ip }}:{{ server.port }}</div>
               
               <div class="flex gap-2 mt-auto pt-4 border-t border-gray-200 dark:border-slate-900">
                  <button 
                    @click="openEditServerModal(group.id, server)" 
                    class="flex-1 py-1.5 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800 rounded transition-colors border border-gray-200 dark:border-transparent"
                  >
                    管理/修改
                  </button>
                  <button 
                    @click="handleDeleteServer(group.id, server.id)"
                    class="px-3 py-1.5 text-xs text-red-500 dark:text-red-400 bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors border border-gray-200 dark:border-transparent"
                  >
                    删除
                  </button>
               </div>
               
               <button 
                  @click="openPlayersModal(server)"
                  class="w-full mt-2 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors flex items-center justify-center gap-1"
               >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                  查看在线玩家
               </button>
               </div>
            </div>
          </div>
        </div>
      </div>

    <!-- Modals -->
    <ServerGroupModal 
      v-model="showGroupModal"
      @save="(data) => { showGroupModal = false }" 
    />
    
    <ServerEditModal
      v-model="showServerModal"
      :group-id="currentEditingGroup"
      :initial-data="currentEditingServer"
      @save="() => { showServerModal = false }"
    />

    <ServerPlayersModal
      v-model="showPlayersModal"
      :server="currentViewingServer"
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
