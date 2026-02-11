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
  <div v-if="modelValue" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div @click="closeModal" class="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"></div>

    <!-- Modal Content -->
    <div class="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 transform transition-all scale-100">
      <h3 class="text-xl font-bold text-white mb-4">创建服务器组</h3>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-400 mb-1">组名称</label>
          <input 
            v-model="groupName"
            type="text" 
            placeholder="例如: CS2 社区服"
            class="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            @keyup.enter="handleSave"
          />
        </div>
      </div>

      <div class="mt-6 flex justify-end gap-3">
        <button 
          @click="closeModal"
          class="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
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
</template>
