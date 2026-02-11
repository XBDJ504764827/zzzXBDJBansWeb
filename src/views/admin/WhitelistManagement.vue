<script setup>
import { ref, onMounted } from 'vue'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import ConfirmModal from '../../components/ConfirmModal.vue'

const whitelist = ref([])
const pendingList = ref([])
const rejectedList = ref([])
const loading = ref(false)
const activeTab = ref('approved') // 'approved', 'pending', 'rejected'
const showAddModal = ref(false)
const formData = ref({
  steam_id: '',
  name: ''
})
const toast = useToast()

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

const fetchWhitelist = async () => {
  loading.value = true
  try {
    const [approvedRes, pendingRes, rejectedRes] = await Promise.all([
      api.get('/whitelist'),
      api.get('/whitelist/pending'),
      api.get('/whitelist/rejected')
    ])
    whitelist.value = approvedRes.data
    pendingList.value = pendingRes.data
    rejectedList.value = rejectedRes.data
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const handleAdd = async () => {
  try {
    const res = await api.post('/whitelist', formData.value)
    
    // Status 201 Created
    if (res.status === 201) {
      showAddModal.value = false
      formData.value = { steam_id: '', name: '' }
      toast.success('添加成功')
      await fetchWhitelist() // Ensure await to refresh list properly
    }
  } catch (err) {
    console.error(err)
    toast.error('添加失败: ' + (err.response?.data?.error || err.message))
  }
}

const handleDelete = async (id) => {
  openConfirmModal(
    '删除确认',
    '确定要删除这条白名单记录吗？',
    'danger',
    async () => {
        try {
            const res = await api.delete(`/whitelist/${id}`)
            if (res.status === 200) {
                toast.success('删除成功')
                fetchWhitelist()
            }
        } catch (err) {
            console.error(err)
            toast.error('删除失败')
        }
    }
  )
}

const handleApprove = async (id) => {
  try {
    await api.put(`/whitelist/${id}/approve`)
    toast.success('审核通过')
    fetchWhitelist()
  } catch (err) {
    console.error(err)
    toast.error('审核失败')
  }
}

const handleReject = async (id) => {
  openConfirmModal(
    '拒绝确认',
    '确定要拒绝此进服申请吗？',
    'warning',
    async () => {
        try {
            await api.put(`/whitelist/${id}/reject`)
            toast.success('已拒绝申请')
            fetchWhitelist()
        } catch (err) {
            console.error(err)
            toast.error('操作失败')
        }
    }
  )
}

onMounted(fetchWhitelist)

// Context Menu Logic
const showContextMenu = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })
const selectedPlayer = ref(null)

const handleContextMenu = (event, item) => {
  showContextMenu.value = true
  contextMenuPosition.value = { x: event.clientX, y: event.clientY }
  selectedPlayer.value = item
}

const closeContextMenu = () => {
  showContextMenu.value = false
}

const getPlayerSteamId = (player) => {
  if (!player) return null
  // 优先使用 steam_id_64，如果没有则尝试使用 steam_id
  return player.steam_id_64 || player.steam_id
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-white">进服申请管理 (白名单)</h2>
      <button 
        @click="showAddModal = true"
        class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        添加玩家
      </button>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 border-b border-slate-800">
      <button 
        @click="activeTab = 'approved'"
        :class="[
          'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
          activeTab === 'approved' 
            ? 'text-blue-400 border-blue-400' 
            : 'text-slate-400 border-transparent hover:text-white'
        ]"
      >
        已通过 ({{ whitelist.length }})
      </button>
      <button 
        @click="activeTab = 'pending'"
        :class="[
          'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
          activeTab === 'pending' 
            ? 'text-yellow-400 border-yellow-400' 
            : 'text-slate-400 border-transparent hover:text-white'
        ]"
      >
        待审核 
        <span v-if="pendingList.length > 0" class="ml-1 px-1.5 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">
          {{ pendingList.length }}
        </span>
      </button>
      <button 
        @click="activeTab = 'rejected'"
        :class="[
          'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
          activeTab === 'rejected' 
            ? 'text-red-400 border-red-400' 
            : 'text-slate-400 border-transparent hover:text-white'
        ]"
      >
        已拒绝 ({{ rejectedList.length }})
      </button>
    </div>

    <!-- Approved Table -->
    <div v-show="activeTab === 'approved'" class="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-slate-950/50 border-b border-slate-800">
              <th class="p-4 text-xs font-semibold text-slate-400 uppercase">ID</th>
              <th class="p-4 text-xs font-semibold text-slate-400 uppercase">玩家昵称</th>
              <th class="p-4 text-xs font-semibold text-slate-400 uppercase">SteamID2</th>
              <th class="p-4 text-xs font-semibold text-slate-400 uppercase">SteamID3</th>
              <th class="p-4 text-xs font-semibold text-slate-400 uppercase">SteamID64</th>
              <th class="p-4 text-xs font-semibold text-slate-400 uppercase">添加时间</th>
              <th class="p-4 text-xs font-semibold text-slate-400 uppercase text-right">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800">
            <tr v-if="loading" class="animate-pulse">
                <td colspan="7" class="p-4 text-center text-slate-500">Loading...</td>
            </tr>
            <tr v-else-if="whitelist.length === 0">
                <td colspan="7" class="p-4 text-center text-slate-500">暂无数据</td>
            </tr>
            <tr v-for="item in whitelist" :key="item.id" class="group hover:bg-slate-800/50 transition-colors" @contextmenu.prevent="handleContextMenu($event, item)">
              <td class="p-4 text-slate-500 text-sm">#{{ item.id }}</td>
              <td class="p-4 text-slate-300">{{ item.name }}</td>
              <td class="p-4 font-mono text-sm text-blue-400">{{ item.steam_id || '-' }}</td>
              <td class="p-4 font-mono text-sm text-green-400">{{ item.steam_id_3 || '-' }}</td>
              <td class="p-4 font-mono text-sm text-yellow-400">{{ item.steam_id_64 || '-' }}</td>
              <td class="p-4 text-slate-400 text-sm">
                {{ new Date(item.created_at).toLocaleString() }}
              </td>
              <td class="p-4 text-right">
                <button 
                  @click="handleDelete(item.id)"
                  class="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-red-400/10 rounded-lg"
                  title="删除"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pending Table -->
    <div v-show="activeTab === 'pending'" class="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-slate-950/50 border-b border-slate-800">
              <th class="p-4 text-xs font-semibold text-slate-400 uppercase">ID</th>
              <th class="p-4 text-xs font-semibold text-slate-400 uppercase">玩家昵称</th>
              <th class="p-4 text-xs font-semibold text-slate-400 uppercase">SteamID64</th>
              <th class="p-4 text-xs font-semibold text-slate-400 uppercase">申请时间</th>
              <th class="p-4 text-xs font-semibold text-slate-400 uppercase text-right">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800">
            <tr v-if="loading" class="animate-pulse">
                <td colspan="5" class="p-4 text-center text-slate-500">Loading...</td>
            </tr>
            <tr v-else-if="pendingList.length === 0">
                <td colspan="5" class="p-4 text-center text-slate-500">暂无待审核申请</td>
            </tr>
            <tr v-for="item in pendingList" :key="item.id" class="group hover:bg-slate-800/50 transition-colors" @contextmenu.prevent="handleContextMenu($event, item)">
              <td class="p-4 text-slate-500 text-sm">#{{ item.id }}</td>
              <td class="p-4 text-slate-300">{{ item.name }}</td>
              <td class="p-4 font-mono text-sm text-yellow-400">{{ item.steam_id_64 || item.steam_id }}</td>
              <td class="p-4 text-slate-400 text-sm">
                {{ new Date(item.created_at).toLocaleString() }}
              </td>
              <td class="p-4 text-right flex items-center justify-end gap-2">
                <button 
                  @click="handleApprove(item.id)"
                  class="text-green-400 hover:text-green-300 transition-colors px-3 py-1.5 hover:bg-green-400/10 rounded-lg text-sm flex items-center gap-1"
                  title="通过"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                  通过
                </button>
                <button 
                  @click="handleReject(item.id)"
                  class="text-red-400 hover:text-red-300 transition-colors px-3 py-1.5 hover:bg-red-400/10 rounded-lg text-sm flex items-center gap-1"
                  title="拒绝"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                  拒绝
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Rejected Table -->
    <div v-show="activeTab === 'rejected'" class="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-slate-950/50 border-b border-slate-800">
              <th class="p-4 text-xs font-semibold text-slate-400 uppercase">ID</th>
              <th class="p-4 text-xs font-semibold text-slate-400 uppercase">玩家昵称</th>
              <th class="p-4 text-xs font-semibold text-slate-400 uppercase">SteamID64</th>
              <th class="p-4 text-xs font-semibold text-slate-400 uppercase">申请时间</th>
              <th class="p-4 text-xs font-semibold text-slate-400 uppercase text-right">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800">
            <tr v-if="loading" class="animate-pulse">
                <td colspan="5" class="p-4 text-center text-slate-500">Loading...</td>
            </tr>
            <tr v-else-if="rejectedList.length === 0">
                <td colspan="5" class="p-4 text-center text-slate-500">暂无已拒绝申请</td>
            </tr>
            <tr v-for="item in rejectedList" :key="item.id" class="group hover:bg-slate-800/50 transition-colors" @contextmenu.prevent="handleContextMenu($event, item)">
              <td class="p-4 text-slate-500 text-sm">#{{ item.id }}</td>
              <td class="p-4 text-slate-300">{{ item.name }}</td>
              <td class="p-4 font-mono text-sm text-red-400">{{ item.steam_id_64 || item.steam_id }}</td>
              <td class="p-4 text-slate-400 text-sm">
                {{ new Date(item.created_at).toLocaleString() }}
              </td>
              <td class="p-4 text-right">
                <button 
                  @click="handleApprove(item.id)"
                  class="text-green-400 hover:text-green-300 transition-colors px-3 py-1.5 hover:bg-green-400/10 rounded-lg text-sm flex items-center gap-1 ml-auto"
                  title="重新通过"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
                  </svg>
                  恢复通过
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add Modal -->
    <div v-if="showAddModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showAddModal = false"></div>
      <div class="relative bg-slate-900 rounded-xl border border-slate-800 p-6 w-full max-w-md shadow-2xl">
        <h3 class="text-lg font-bold text-white mb-4">添加白名单 (进服申请)</h3>
        
        <form @submit.prevent="handleAdd" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-400 mb-1">Steam ID</label>
            <input 
              v-model="formData.steam_id"
              type="text" 
              required
              placeholder="e.g. 76561198000000000"
              class="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-400 mb-1">玩家昵称</label>
            <input 
              v-model="formData.name"
              type="text" 
              required
              placeholder="e.g. Simple"
              class="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
          </div>

          <div class="flex items-center justify-end gap-3 mt-6">
            <button 
              type="button" 
              @click="showAddModal = false"
              class="px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              取消
            </button>
            <button 
              type="submit"
              class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors"
            >
              确认添加
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Context Menu -->
    <div v-if="showContextMenu" class="fixed inset-0 z-[100]" @click="closeContextMenu" @contextmenu.prevent="closeContextMenu">
      <div 
        class="fixed bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 w-48 overflow-hidden"
        :style="{ top: `${contextMenuPosition.y}px`, left: `${contextMenuPosition.x}px` }"
        @click.stop
      >
        <a 
          v-if="getPlayerSteamId(selectedPlayer)"
          :href="`https://gokz.top/profile/${getPlayerSteamId(selectedPlayer)}`"
          target="_blank"
          class="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-2"
          @click="closeContextMenu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          GOKZ.TOP 主页
        </a>
        <a 
          v-if="getPlayerSteamId(selectedPlayer)"
          :href="`https://kzgo.eu/players/${getPlayerSteamId(selectedPlayer)}`"
          target="_blank"
          class="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-2"
          @click="closeContextMenu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          GOKZ.EU 主页
        </a>
        <div v-else class="px-4 py-2 text-sm text-slate-500 italic">
          无效的 SteamID
        </div>
      </div>
    </div>

    
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
