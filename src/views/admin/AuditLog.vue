<script setup>
import { computed, onMounted } from 'vue'
import { useLogStore } from '../../composables/useLogStore'

const { logs, fetchLogs } = useLogStore()

onMounted(() => {
    fetchLogs()
})

const hasLogs = computed(() => logs.value.length > 0)

const getActionColor = (action) => {
    if (action.includes('删除') || action.includes('解封') || action.includes('Ban')) return 'text-red-400'
    if (action.includes('新增') || action.includes('创建')) return 'text-green-400'
    if (action.includes('修改') || action.includes('编辑')) return 'text-blue-400'
    return 'text-gray-300'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-white">操作日志</h1>
        <p class="text-gray-400 text-sm mt-1">查看系统管理员的所有操作记录</p>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!hasLogs" class="flex flex-col items-center justify-center py-20 bg-[#1a1d24] border border-white/5 rounded-xl">
      <div class="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-white mb-1">无日志记录</h3>
      <p class="text-gray-400 text-sm">暂无任何操作记录</p>
    </div>

    <!-- Log List -->
    <div v-else class="bg-[#1a1d24] border border-white/5 rounded-xl overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
                <thead>
                    <tr class="border-b border-white/5 bg-white/5">
                        <th class="px-6 py-4 font-medium text-gray-300">时间</th>
                        <th class="px-6 py-4 font-medium text-gray-300">操作人</th>
                        <th class="px-6 py-4 font-medium text-gray-300">动作</th>
                        <th class="px-6 py-4 font-medium text-gray-300">目标对象</th>
                        <th class="px-6 py-4 font-medium text-gray-300">详细信息</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                    <tr v-for="log in logs" :key="log.id" class="hover:bg-white/5 transition-colors">
                         <td class="px-6 py-4 text-gray-400 font-mono text-xs">
                            {{ new Date(log.created_at).toLocaleString() }}
                        </td>
                        <td class="px-6 py-4">
                            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-200">
                                {{ log.admin_username }}
                            </span>
                        </td>
                        <td class="px-6 py-4 font-medium" :class="getActionColor(log.action)">
                            {{ log.action }}
                        </td>
                        <td class="px-6 py-4 text-gray-300">{{ log.target }}</td>
                        <td class="px-6 py-4 text-gray-400">{{ log.details }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
  </div>
</template>
