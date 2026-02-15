<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/utils/api'
import { useToast } from '@/composables/useToast'
import ConfirmModal from '../../components/ConfirmModal.vue'

const route = useRoute()
const router = useRouter()

const whitelist = ref([])
const pendingList = ref([])
const rejectedList = ref([])
const loading = ref(false)

// Initialize from URL query or default to 'approved'
const activeTab = ref(route.query.tab || 'approved') 

// Watch for changes and update URL
watch(activeTab, (newTab) => {
    router.replace({ query: { ...route.query, tab: newTab } })
})
const showAddModal = ref(false)
const formData = ref({
  steam_id: '',
  name: ''
})
const toast = useToast()

// Rejection Modal Logic
const showRejectModal = ref(false)
const rejectReason = ref('')
const rejectTargetId = ref(null)

const openRejectModal = (id) => {
    rejectTargetId.value = id
    rejectReason.value = ''
    showRejectModal.value = true
}

const confirmReject = async () => {
    if (!rejectReason.value.trim()) {
        toast.error('请填写拒绝理由')
        return
    }
    
    try {
        await api.put(`/whitelist/${rejectTargetId.value}/reject`, {
            reason: rejectReason.value
        })
        toast.success('已拒绝申请')
        showRejectModal.value = false
        fetchWhitelist()
    } catch (err) {
        console.error(err)
        toast.error('操作失败')
    }
}

// Ban Check Logic
const banCache = ref({}) // key: steam_id_64, value: ban data object or null

const checkGlobalBans = async (list) => {
    const steamIdsToCheck = list
        .map(item => item.steam_id_64 || item.steam_id)
        .filter(id => id && banCache.value[id] === undefined);

    if (steamIdsToCheck.length === 0) return;

    try {
        const response = await api.post('/check_global_ban/bulk', {
            steam_ids: steamIdsToCheck
        });

        if (response.data) {
            const resultMap = response.data;
            for (const [steamId, banData] of Object.entries(resultMap)) {
                // GOKZ API returns { data: [...], count: ... } for individual bans
                // Our bulk endpoint returns { "steamid": { data: ..., count: ... } or null }
                if (banData) {
                     const bans = Array.isArray(banData) ? banData : (banData.data || []);
                     if (bans && bans.length > 0) {
                        banCache.value[steamId] = bans;
                     } else {
                        banCache.value[steamId] = null;
                     }
                } else {
                    banCache.value[steamId] = null;
                }
            }
        }
    } catch (e) {
        console.error('Failed to bulk check bans', e);
        // On error, set all to null to prevent retry loops
         for (const id of steamIdsToCheck) {
             banCache.value[id] = null;
         }
    }
}

// Collapse Logic
const expandedBans = ref({}) // key: steamId, value: boolean

const toggleBanDetails = (key) => {
    expandedBans.value[key] = !expandedBans.value[key]
}

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
    
    // Check bans for all lists to show warnings everywhere
    checkGlobalBans(pendingList.value)
    checkGlobalBans(whitelist.value)
    checkGlobalBans(rejectedList.value)
    
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
      lookupResult.value = null
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

const handleReject = (id) => {
    openRejectModal(id)
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

const getPlayerSteamProfile = (player) => {
    const id = getPlayerSteamId(player)
    if (!id) return null
    // Simple heuristic: if it looks like ID64 (starts with 7 and long), use profiles, otherwise might be custom URL or ID3?
    // Usually steam_id_64 is reliable.
    return `https://steamcommunity.com/profiles/${id}`
}

// Player Lookup Logic
const lookupLoading = ref(false)
const lookupResult = ref(null)

const handleLookup = async () => {
    if (!formData.value.steam_id.trim()) return
    
    lookupLoading.value = true
    lookupResult.value = null
    
    try {
        const res = await api.get('/whitelist/player-info', {
            params: { steam_id: formData.value.steam_id }
        })
        
        if (res.data) {
            lookupResult.value = res.data
            // Auto fill name if empty or if user hasn't typed anything custom yet
            // actually just overwrite is usually better for "lookup", but generic behavior:
            formData.value.name = res.data.personaname || ''
            // Update steam_id to 64 if resolved (optional, but good for consistency)
            if (res.data.steamid) {
                formData.value.steam_id = res.data.steamid
            }
        }
    } catch (err) {
        console.error(err)
        toast.error('未找到玩家或 ID 无效')
    } finally {
        lookupLoading.value = false
    }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-slate-900 dark:text-white">进服申请管理 (白名单)</h2>
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
    <div class="flex gap-2 border-b border-gray-200 dark:border-slate-800">
      <button 
        @click="activeTab = 'approved'"
        :class="[
          'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
          activeTab === 'approved' 
            ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400' 
            : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-white'
        ]"
      >
        已通过 ({{ whitelist.length }})
      </button>
      <button 
        @click="activeTab = 'pending'"
        :class="[
          'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
          activeTab === 'pending' 
            ? 'text-amber-600 dark:text-yellow-400 border-amber-600 dark:border-yellow-400' 
            : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-white'
        ]"
      >
        待审核 
        <span v-if="pendingList.length > 0" class="ml-1 px-1.5 py-0.5 text-xs bg-amber-100 dark:bg-yellow-500/20 text-amber-700 dark:text-yellow-400 rounded-full">
          {{ pendingList.length }}
        </span>
      </button>
      <button 
        @click="activeTab = 'rejected'"
        :class="[
          'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
          activeTab === 'rejected' 
            ? 'text-red-600 dark:text-red-400 border-red-600 dark:border-red-400' 
            : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-white'
        ]"
      >
        已拒绝 ({{ rejectedList.length }})
      </button>
    </div>

    <!-- Approved Table -->
    <div v-show="activeTab === 'approved'" class="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-gray-50 dark:bg-slate-950/50 border-b border-gray-200 dark:border-slate-800">
              <th class="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">ID</th>
              <th class="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">玩家昵称</th>
              <th class="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">SteamID2</th>
              <th class="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">SteamID3</th>
              <th class="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">SteamID64</th>
              <th class="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">添加时间</th>
              <th class="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">处理人</th>
              <th class="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase text-right">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-slate-800">
            <tr v-if="loading" class="animate-pulse">
                <td colspan="8" class="p-4 text-center text-slate-500">Loading...</td>
            </tr>
            <tr v-else-if="whitelist.length === 0">
                <td colspan="8" class="p-4 text-center text-slate-500">暂无数据</td>
            </tr>
            <template v-for="item in whitelist" :key="item.id">
            <tr class="group hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors" @contextmenu.prevent="handleContextMenu($event, item)">
              <td class="p-4 text-slate-500 dark:text-slate-500 text-sm">#{{ item.id }}</td>
              <td class="p-4 text-slate-900 dark:text-slate-300">
                  {{ item.name }}
                  <div v-if="banCache[item.steam_id_64 || item.steam_id]" class="mt-1">
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                          Global封禁记录
                      </span>
                  </div>
              </td>
              <td class="p-4 font-mono text-sm text-blue-600 dark:text-blue-400">{{ item.steam_id || '-' }}</td>
              <td class="p-4 font-mono text-sm text-green-600 dark:text-green-400">{{ item.steam_id_3 || '-' }}</td>
              <td class="p-4 font-mono text-sm text-amber-600 dark:text-yellow-400">{{ item.steam_id_64 || '-' }}</td>
              <td class="p-4 text-slate-500 dark:text-slate-400 text-sm">
                {{ new Date(item.created_at).toLocaleString() }}
              </td>
              <td class="p-4 text-slate-500 dark:text-slate-400 text-sm">{{ item.admin_name || '-' }}</td>
              <td class="p-4 text-right">
                <button 
                  @click="handleDelete(item.id)"
                  class="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors p-2 hover:bg-red-50 dark:hover:bg-red-400/10 rounded-lg"
                  title="删除"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                </button>
              </td>
            </tr>
            <!-- Ban Info Row for Approved -->
            <tr v-if="banCache[item.steam_id_64 || item.steam_id]" class="bg-red-50 dark:bg-red-950/10 border-b border-red-100 dark:border-red-900/20">
                <td colspan="8" class="p-4">
                    <div class="space-y-3">
                        <div 
                            class="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-red-700 dark:hover:text-red-300 transition-colors select-none"
                            @click="toggleBanDetails(item.steam_id_64 || item.steam_id)"
                        >
                            <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                class="h-4 w-4 transition-transform duration-200" 
                                :class="{ 'rotate-90': expandedBans[item.steam_id_64 || item.steam_id] }"
                                viewBox="0 0 20 20" 
                                fill="currentColor"
                            >
                                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                            </svg>
                           检测到 GOKZ 全局封禁记录 ({{ banCache[item.steam_id_64 || item.steam_id].length }}) - 点击展开详情
                        </div>
                        
                        <div v-show="expandedBans[item.steam_id_64 || item.steam_id]" class="grid gap-2 transition-all duration-300 ease-in-out">
                            <div v-for="ban in banCache[item.steam_id_64 || item.steam_id]" :key="ban.ban_id" class="bg-white dark:bg-slate-950/50 border border-red-200 dark:border-red-900/30 rounded-lg p-3 text-sm">
                                <div class="flex items-start justify-between gap-4">
                                    <div class="space-y-2 w-full">
                                        <div class="flex items-center gap-2">
                                            <span class="text-slate-500 dark:text-slate-400 text-xs w-20 text-right shrink-0">封禁属性:</span>
                                            <span class="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300 border border-red-200 dark:border-red-500/30 uppercase">
                                                {{ ban.ban_type }}
                                            </span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <span class="text-slate-500 dark:text-slate-400 text-xs w-20 text-right shrink-0">封禁服务器:</span>
                                            <span class="text-slate-700 dark:text-slate-300 font-medium text-sm">{{ ban.server_name }}</span>
                                        </div>
                                        <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                                            <span class="w-20 text-right shrink-0">封禁时间:</span>
                                            <span class="font-mono">{{ new Date(ban.created_on).toLocaleString() }}</span>
                                        </div>
                                        <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                                            <span class="w-20 text-right shrink-0">过期时间:</span>
                                            <span v-if="ban.expires_on" class="font-mono" :class="new Date(ban.expires_on) > new Date() ? 'text-red-500 dark:text-red-400' : 'text-slate-500'">
                                                {{ new Date(ban.expires_on).toLocaleString() }}
                                            </span>
                                            <span v-else class="text-red-500 dark:text-red-400 font-bold">永久封禁</span>
                                        </div>
                                        <div v-if="ban.stats" class="flex items-start gap-2">
                                            <span class="text-slate-500 dark:text-slate-400 text-xs w-20 text-right shrink-0 mt-1">统计数据:</span>
                                            <div class="text-slate-600 dark:text-slate-500 text-xs font-mono bg-gray-50 dark:bg-black/20 px-2 py-1 rounded break-all whitespace-pre-wrap">
                                                {{ ban.stats }}
                                            </div>
                                        </div>
                                        <div v-if="ban.notes" class="flex items-start gap-2">
                                            <span class="text-slate-500 dark:text-slate-400 text-xs w-20 text-right shrink-0">备注:</span>
                                            <span class="text-slate-500 dark:text-slate-400 text-xs italic">{{ ban.notes }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pending Table -->
    <div v-show="activeTab === 'pending'" class="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-gray-50 dark:bg-slate-950/50 border-b border-gray-200 dark:border-slate-800">
              <th class="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">ID</th>
              <th class="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">玩家昵称</th>
              <th class="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">SteamID64</th>
              <th class="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">申请时间</th>
              <th class="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase text-right">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-slate-800">
            <tr v-if="loading" class="animate-pulse">
                <td colspan="5" class="p-4 text-center text-slate-500">Loading...</td>
            </tr>
            <tr v-else-if="pendingList.length === 0">
                <td colspan="5" class="p-4 text-center text-slate-500">暂无待审核申请</td>
            </tr>
            <template v-for="item in pendingList" :key="item.id">
                <tr class="group hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors" @contextmenu.prevent="handleContextMenu($event, item)">
                <td class="p-4 text-slate-500 dark:text-slate-500 text-sm">#{{ item.id }}</td>
                <td class="p-4 text-slate-900 dark:text-slate-300">
                    {{ item.name }}
                    <div v-if="banCache[item.steam_id_64 || item.steam_id]" class="mt-1">
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                            Global封禁记录
                        </span>
                    </div>
                </td>
                <td class="p-4 font-mono text-sm text-amber-600 dark:text-yellow-400">{{ item.steam_id_64 || item.steam_id }}</td>
                <td class="p-4 text-slate-500 dark:text-slate-400 text-sm">
                    {{ new Date(item.created_at).toLocaleString() }}
                </td>
                <td class="p-4 text-right flex items-center justify-end gap-2">
                    <button 
                    @click="handleApprove(item.id)"
                    class="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors px-3 py-1.5 hover:bg-green-50 dark:hover:bg-green-400/10 rounded-lg text-sm flex items-center gap-1"
                    title="通过"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    通过
                    </button>
                    <button 
                    @click="handleReject(item.id)"
                    class="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-400/10 rounded-lg text-sm flex items-center gap-1"
                    title="拒绝"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                    拒绝
                    </button>
                </td>
                </tr>
                <!-- Ban Info Row -->
                <tr v-if="banCache[item.steam_id_64 || item.steam_id]" class="bg-red-50 dark:bg-red-950/10 border-b border-red-100 dark:border-red-900/20">
                    <td colspan="5" class="p-4">
                        <div class="space-y-3">
                            <div 
                                class="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-red-700 dark:hover:text-red-300 transition-colors select-none"
                                @click="toggleBanDetails(item.steam_id_64 || item.steam_id)"
                            >
                                <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    class="h-4 w-4 transition-transform duration-200" 
                                    :class="{ 'rotate-90': expandedBans[item.steam_id_64 || item.steam_id] }"
                                    viewBox="0 0 20 20" 
                                    fill="currentColor"
                                >
                                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                                </svg>
                               检测到 GOKZ 全局封禁记录 ({{ banCache[item.steam_id_64 || item.steam_id].length }}) - 点击展开详情
                            </div>
                            
                            <div v-show="expandedBans[item.steam_id_64 || item.steam_id]" class="grid gap-2 transition-all duration-300 ease-in-out">
                                <div v-for="ban in banCache[item.steam_id_64 || item.steam_id]" :key="ban.ban_id" class="bg-white dark:bg-slate-950/50 border border-red-200 dark:border-red-900/30 rounded-lg p-3 text-sm">
                                    <div class="flex items-start justify-between gap-4">
                                        <div class="space-y-2 w-full">
                                            <!-- Ban Type -->
                                            <div class="flex items-center gap-2">
                                                <span class="text-slate-500 dark:text-slate-400 text-xs w-20 text-right shrink-0">封禁属性:</span>
                                                <span class="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300 border border-red-200 dark:border-red-500/30 uppercase">
                                                    {{ ban.ban_type }}
                                                </span>
                                            </div>
                                            
                                            <!-- Server Name -->
                                            <div class="flex items-center gap-2">
                                                <span class="text-slate-500 dark:text-slate-400 text-xs w-20 text-right shrink-0">封禁服务器:</span>
                                                <span class="text-slate-700 dark:text-slate-300 font-medium text-sm">{{ ban.server_name }}</span>
                                            </div>

                                            <!-- Created Time -->
                                            <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                                                <span class="w-20 text-right shrink-0">封禁时间:</span>
                                                <span class="font-mono">{{ new Date(ban.created_on).toLocaleString() }}</span>
                                            </div>

                                            <!-- Expires Time -->
                                            <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                                                <span class="w-20 text-right shrink-0">过期时间:</span>
                                                <span v-if="ban.expires_on" class="font-mono" :class="new Date(ban.expires_on) > new Date() ? 'text-red-500 dark:text-red-400' : 'text-slate-500'">
                                                    {{ new Date(ban.expires_on).toLocaleString() }}
                                                </span>
                                                <span v-else class="text-red-500 dark:text-red-400 font-bold">永久封禁</span>
                                            </div>

                                            <!-- Stats -->
                                            <div v-if="ban.stats" class="flex items-start gap-2">
                                                <span class="text-slate-500 dark:text-slate-400 text-xs w-20 text-right shrink-0 mt-1">统计数据:</span>
                                                <div class="text-slate-600 dark:text-slate-500 text-xs font-mono bg-gray-50 dark:bg-black/20 px-2 py-1 rounded break-all whitespace-pre-wrap">
                                                    {{ ban.stats }}
                                                </div>
                                            </div>

                                            <!-- Notes -->
                                            <div v-if="ban.notes" class="flex items-start gap-2">
                                                <span class="text-slate-500 dark:text-slate-400 text-xs w-20 text-right shrink-0">备注:</span>
                                                <span class="text-slate-500 dark:text-slate-400 text-xs italic">{{ ban.notes }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Rejected Table -->
    <div v-show="activeTab === 'rejected'" class="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-gray-50 dark:bg-slate-950/50 border-b border-gray-200 dark:border-slate-800">
              <th class="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">ID</th>
              <th class="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">玩家昵称</th>
              <th class="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">SteamID64</th>
              <th class="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">拒绝理由</th>
              <th class="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">申请时间</th>
              <th class="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">处理人</th>
              <th class="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase text-right">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-slate-800">
            <tr v-if="loading" class="animate-pulse">
                <td colspan="7" class="p-4 text-center text-slate-500">Loading...</td>
            </tr>
            <tr v-else-if="rejectedList.length === 0">
                <td colspan="7" class="p-4 text-center text-slate-500">暂无已拒绝申请</td>
            </tr>
            <template v-for="item in rejectedList" :key="item.id">
            <tr class="group hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors" @contextmenu.prevent="handleContextMenu($event, item)">
              <td class="p-4 text-slate-500 dark:text-slate-500 text-sm">#{{ item.id }}</td>
              <td class="p-4 text-slate-900 dark:text-slate-300">
                  {{ item.name }}
                  <div v-if="banCache[item.steam_id_64 || item.steam_id]" class="mt-1">
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                          Global封禁记录
                      </span>
                  </div>
              </td>
              <td class="p-4 font-mono text-sm text-red-600 dark:text-red-400">{{ item.steam_id_64 || item.steam_id }}</td>
              <td class="p-4 text-sm text-red-500 dark:text-red-300 max-w-xs truncate" :title="item.reject_reason">
                  {{ item.reject_reason || '-' }}
              </td>
              <td class="p-4 text-slate-500 dark:text-slate-400 text-sm">
                {{ new Date(item.created_at).toLocaleString() }}
              </td>
              <td class="p-4 text-slate-500 dark:text-slate-400 text-sm">{{ item.admin_name || '-' }}</td>
              <td class="p-4 text-right">
                <button 
                  @click="handleApprove(item.id)"
                  class="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors px-3 py-1.5 hover:bg-green-50 dark:hover:bg-green-400/10 rounded-lg text-sm flex items-center gap-1 ml-auto"
                  title="重新通过"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
                  </svg>
                  恢复通过
                </button>
              </td>
            </tr>
            <!-- Ban Info Row for Rejected -->
             <tr v-if="banCache[item.steam_id_64 || item.steam_id]" class="bg-red-50 dark:bg-red-950/10 border-b border-red-100 dark:border-red-900/20">
                <td colspan="7" class="p-4">
                    <div class="space-y-3">
                        <div 
                            class="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-red-700 dark:hover:text-red-300 transition-colors select-none"
                            @click="toggleBanDetails(item.steam_id_64 || item.steam_id)"
                        >
                            <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                class="h-4 w-4 transition-transform duration-200" 
                                :class="{ 'rotate-90': expandedBans[item.steam_id_64 || item.steam_id] }"
                                viewBox="0 0 20 20" 
                                fill="currentColor"
                            >
                                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                            </svg>
                           检测到 GOKZ 全局封禁记录 ({{ banCache[item.steam_id_64 || item.steam_id].length }}) - 点击展开详情
                        </div>
                        
                        <div v-show="expandedBans[item.steam_id_64 || item.steam_id]" class="grid gap-2 transition-all duration-300 ease-in-out">
                            <div v-for="ban in banCache[item.steam_id_64 || item.steam_id]" :key="ban.ban_id" class="bg-white dark:bg-slate-950/50 border border-red-200 dark:border-red-900/30 rounded-lg p-3 text-sm">
                                <div class="flex items-start justify-between gap-4">
                                    <div class="space-y-2 w-full">
                                        <div class="flex items-center gap-2">
                                            <span class="text-slate-500 dark:text-slate-400 text-xs w-20 text-right shrink-0">封禁属性:</span>
                                            <span class="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300 border border-red-200 dark:border-red-500/30 uppercase">
                                                {{ ban.ban_type }}
                                            </span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <span class="text-slate-500 dark:text-slate-400 text-xs w-20 text-right shrink-0">封禁服务器:</span>
                                            <span class="text-slate-700 dark:text-slate-300 font-medium text-sm">{{ ban.server_name }}</span>
                                        </div>
                                        <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                                            <span class="w-20 text-right shrink-0">封禁时间:</span>
                                            <span class="font-mono">{{ new Date(ban.created_on).toLocaleString() }}</span>
                                        </div>
                                        <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                                            <span class="w-20 text-right shrink-0">过期时间:</span>
                                            <span v-if="ban.expires_on" class="font-mono" :class="new Date(ban.expires_on) > new Date() ? 'text-red-500 dark:text-red-400' : 'text-slate-500'">
                                                {{ new Date(ban.expires_on).toLocaleString() }}
                                            </span>
                                            <span v-else class="text-red-500 dark:text-red-400 font-bold">永久封禁</span>
                                        </div>
                                        <div v-if="ban.stats" class="flex items-start gap-2">
                                            <span class="text-slate-500 dark:text-slate-400 text-xs w-20 text-right shrink-0 mt-1">统计数据:</span>
                                            <div class="text-slate-600 dark:text-slate-500 text-xs font-mono bg-gray-50 dark:bg-black/20 px-2 py-1 rounded break-all whitespace-pre-wrap">
                                                {{ ban.stats }}
                                            </div>
                                        </div>
                                         <div v-if="ban.notes" class="flex items-start gap-2">
                                            <span class="text-slate-500 dark:text-slate-400 text-xs w-20 text-right shrink-0">备注:</span>
                                            <span class="text-slate-500 dark:text-slate-400 text-xs italic">{{ ban.notes }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add Whitelist Modal -->
    <div v-if="showAddModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 border border-gray-200 dark:border-slate-800 shadow-xl">
            <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-4">添加白名单</h3>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">SteamID (任意格式) <span class="text-red-500">*</span></label>
                    <input 
                        v-model="newWhitelist.steamId"
                        type="text" 
                        class="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="STEAM_1:..."
                    >
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">玩家昵称 (可选)</label>
                    <input 
                        v-model="newWhitelist.name"
                        type="text" 
                        class="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="输入玩家昵称"
                    >
                </div>
                <div class="flex items-center justify-end gap-3 mt-6">
                    <button 
                        @click="showAddModal = false"
                        class="px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        取消
                    </button>
                    <button 
                        @click="handleAddWhitelist"
                        class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        添加
                    </button>
                </div>
            </div>
        </div>
    </div>


    <!-- Reject Reason Modal -->
    <div v-if="showRejectModal" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="showRejectModal = false"></div>
        <div class="relative bg-slate-900 rounded-xl border border-slate-800 p-6 w-full max-w-md shadow-2xl">
            <h3 class="text-lg font-bold text-white mb-4">拒绝申请</h3>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-slate-400 mb-1">拒绝理由 <span class="text-red-500">*</span></label>
                    <textarea 
                        v-model="rejectReason"
                        rows="3"
                        class="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        placeholder="请输入拒绝理由..."
                    ></textarea>
                </div>
                <div class="flex items-center justify-end gap-3 mt-6">
                    <button 
                        @click="showRejectModal = false"
                        class="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                    >
                        取消
                    </button>
                    <button 
                        @click="confirmReject"
                        class="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        确认拒绝
                    </button>
                </div>
            </div>
        </div>
    </div>


    <!-- Context Menu -->
    <div v-if="showContextMenu" class="fixed inset-0 z-[100]" @click="closeContextMenu" @contextmenu.prevent="closeContextMenu">
      <div 
        class="fixed bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl py-1 w-48 overflow-hidden"
        :style="{ top: `${contextMenuPosition.y}px`, left: `${contextMenuPosition.x}px` }"
        @click.stop
      >
        <a 
          v-if="getPlayerSteamId(selectedPlayer)"
          :href="`https://gokz.top/profile/${getPlayerSteamId(selectedPlayer)}`"
          target="_blank"
          class="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-2"
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
          class="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-2"
          @click="closeContextMenu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          GOKZ.EU 主页
        </a>
        <a 
          v-if="getPlayerSteamProfile(selectedPlayer)"
          :href="getPlayerSteamProfile(selectedPlayer)"
          target="_blank"
          class="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-2"
          @click="closeContextMenu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          Steam 主页
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
