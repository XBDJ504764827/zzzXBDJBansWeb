<script setup>
import { ref, computed } from 'vue'
import { usePlayerRecordStore } from '../../composables/usePlayerRecordStore'

const { records } = usePlayerRecordStore()

const searchQuery = ref('')

const filteredRecords = computed(() => {
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
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-end">
      <div>
        <h1 class="text-2xl font-bold text-white">玩家记录</h1>
        <p class="text-gray-400 text-sm mt-1">查看玩家进入服务器的历史记录</p>
      </div>
      
      <!-- Search -->
      <div class="w-full max-w-md">
          <div class="relative">
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
    <div class="bg-[#1a1d24] border border-white/5 rounded-xl overflow-hidden">
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
                    </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                    <tr v-if="filteredRecords.length === 0">
                        <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                            未找到匹配的记录
                        </td>
                    </tr>
                    <tr v-for="record in filteredRecords" :key="record.id" class="hover:bg-white/5 transition-colors">
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
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
  </div>
</template>
