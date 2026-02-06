<script setup>
import { ref, onMounted } from 'vue'
import api from '@/utils/api'

const whitelist = ref([])
const loading = ref(false)
const showAddModal = ref(false)
const formData = ref({
  steam_id: '',
  name: ''
})

const fetchWhitelist = async () => {
  loading.value = true
  try {
    const res = await api.get('/whitelist')
    whitelist.value = res.data
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const handleAdd = async () => {
  try {
    const res = await api.post('/whitelist', formData.value)
    
    if (res.status === 200 || res.status === 201) {
      showAddModal.value = false
      formData.value = { steam_id: '', name: '' }
      fetchWhitelist()
    } else {
        alert('Failed to add whitelist')
    }
  } catch (err) {
    console.error(err)
    alert('Failed to add whitelist: ' + (err.response?.data?.error || err.message))
  }
}

const handleDelete = async (id) => {
  if (!confirm('确定要删除吗？')) return

  try {
    const res = await api.delete(`/whitelist/${id}`)
    
    if (res.status === 200) {
      fetchWhitelist()
    }
  } catch (err) {
    console.error(err)
  }
}

onMounted(fetchWhitelist)
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

    <!-- Table -->
    <div class="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-slate-950/50 border-b border-slate-800">
              <th class="p-4 text-xs font-semibold text-slate-400 uppercase">ID</th>
              <th class="p-4 text-xs font-semibold text-slate-400 uppercase">玩家昵称</th>
              <th class="p-4 text-xs font-semibold text-slate-400 uppercase">SteamID2</th>
              <th class="p-4 text-xs font-semibold text-slate-400 uppercase">SteamID3</th>
              <th class="p-4 text-xs font-semibold text-slate-400 uppercase">SteamID64</th>
              <th class="p-4 text-xs font-semibold text-slate-400 uppercase">状态</th>
              <th class="p-4 text-xs font-semibold text-slate-400 uppercase">添加时间</th>
              <th class="p-4 text-xs font-semibold text-slate-400 uppercase text-right">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800">
            <tr v-if="loading" class="animate-pulse">
                <td colspan="8" class="p-4 text-center text-slate-500">Loading...</td>
            </tr>
            <tr v-else-if="whitelist.length === 0">
                <td colspan="8" class="p-4 text-center text-slate-500">暂无数据</td>
            </tr>
            <tr v-for="item in whitelist" :key="item.id" class="group hover:bg-slate-800/50 transition-colors">
              <td class="p-4 text-slate-500 text-sm">#{{ item.id }}</td>
              <td class="p-4 text-slate-300">{{ item.name }}</td>
              <td class="p-4 font-mono text-sm text-blue-400">{{ item.steam_id || '-' }}</td>
              <td class="p-4 font-mono text-sm text-green-400">{{ item.steam_id_3 || '-' }}</td>
              <td class="p-4 font-mono text-sm text-yellow-400">{{ item.steam_id_64 || '-' }}</td>
              <td class="p-4">
                  <span class="px-2 py-1 text-xs font-medium rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                      {{ item.status || 'Approved' }}
                  </span>
              </td>
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
  </div>
</template>
