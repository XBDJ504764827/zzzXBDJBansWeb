<script setup>
import { ref } from 'vue'
import { useCommunityStore } from '@/composables/useCommunityStore'
import { useToast } from '@/composables/useToast'

const props = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue', 'save'])

const store = useCommunityStore()
const { addServerGroup } = store
const toast = useToast()

const groupName = ref('')

const closeModal = () => {
  emit('update:modelValue', false)
  groupName.value = ''
}

const handleSave = async () => {
  if (!groupName.value.trim()) return
  
  const res = await addServerGroup(groupName.value)
  if (res.success) {
    toast.success('服务器组创建成功')
    emit('save')
    groupName.value = ''
    closeModal()
  } else {
    toast.error(res.message)
  }
}
</script>

<template>
  <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeModal"></div>
    <div class="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full p-6 relative border border-gray-200 dark:border-white/10 shadow-xl transition-colors">
      <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-4">添加服务器组</h3>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-gray-400 mb-1">组名称</label>
          <input 
            v-model="groupName"
            type="text"
            class="w-full px-3 py-2 bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="例如: 混战服"
            @keyup.enter="handleSave"
          />
        </div>
        
        <div class="flex justify-end gap-3 pt-2">
          <button 
            @click="closeModal"
            class="px-4 py-2 text-sm text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            取消
          </button>
        <button 
          @click="handleSave"
          :disabled="!groupName.trim()"
          class="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          确认创建
        </button>
      </div>
    </div>
  </div>
  </div>
</template>
