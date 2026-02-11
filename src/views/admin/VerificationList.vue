<script setup>
import { ref, onMounted } from 'vue'
import api from '@/utils/api'
import ConfirmModal from '@/components/ConfirmModal.vue'

const verifications = ref([])
const loading = ref(false)

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

const fetchVerifications = async () => {
  loading.value = true
  try {
    const res = await api.get('/verifications')
    verifications.value = res.data
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const handleDelete = async (steam_id) => {
  openConfirmModal(
    '删除验证记录',
    '确定要删除吗？',
    'danger',
    async () => {
        try {
            const res = await api.delete(`/verifications/${steam_id}`)
            if (res.status === 200 || res.status === 204) {
                fetchVerifications()
            }
        } catch (err) {
            console.error(err)
        }
    }
  )
}

const getStatusColor = (status) => {
    switch(status) {
        case 'allowed': return 'text-green-400 border-green-500/20 bg-green-500/10';
        case 'denied': return 'text-red-400 border-red-500/20 bg-red-500/10';
        default: return 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10';
    }
}

onMounted(fetchVerifications)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-white">进服列表</h2>
    </div>

    <!-- Table -->
    <div class="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-slate-950/50 border-b border-slate-800">
              <th class="p-4 text-xs font-semibold text-slate-400 uppercase">Steam ID</th>
              <th class="p-4 text-xs font-semibold text-slate-400 uppercase">状态</th>
              <th class="p-4 text-xs font-semibold text-slate-400 uppercase">原因/备注</th>
              <th class="p-4 text-xs font-semibold text-slate-400 uppercase">等级/时长</th>
              <th class="p-4 text-xs font-semibold text-slate-400 uppercase">上次更新</th>
              <th class="p-4 text-xs font-semibold text-slate-400 uppercase text-right">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800">
            <tr v-if="loading" class="animate-pulse">
                <td colspan="6" class="p-4 text-center text-slate-500">Loading...</td>
            </tr>
            <tr v-else-if="verifications.length === 0">
                <td colspan="6" class="p-4 text-center text-slate-500">暂无数据</td>
            </tr>
            <tr v-for="item in verifications" :key="item.steam_id" class="group hover:bg-slate-800/50 transition-colors">
              <td class="p-4 font-mono text-sm text-blue-400">{{ item.steam_id }}</td>
              <td class="p-4">
                  <span class="px-2 py-1 text-xs font-medium rounded-full border" :class="getStatusColor(item.status)">
                      {{ item.status }}
                  </span>
              </td>
              <td class="p-4 text-slate-300 text-sm max-w-xs truncate" :title="item.reason">{{ item.reason || '-' }}</td>
              <td class="p-4 text-slate-400 text-sm">
                  <div class="flex flex-col gap-1">
                      <span v-if="item.steam_level !== null">Lv.{{ item.steam_level }}</span>
                      <span v-if="item.playtime_minutes !== null">{{ (item.playtime_minutes / 60).toFixed(1) }}h</span>
                      <span v-if="item.steam_level === null && item.playtime_minutes === null" class="text-slate-600">-</span>
                  </div>
              </td>
              <td class="p-4 text-slate-500 text-xs font-mono">
                {{ new Date(item.updated_at || item.created_at).toLocaleString() }}
              </td>
              <td class="p-4 text-right">
                <button 
                  @click="handleDelete(item.steam_id)"
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
