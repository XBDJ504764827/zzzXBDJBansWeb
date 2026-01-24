<script setup>
import { ref, watch, computed } from 'vue'
import { useCommunityStore } from '@/composables/useCommunityStore'

const props = defineProps({
  modelValue: Boolean,
  groupId: String,
  initialData: Object // Null if creating new, Object if editing
})

const emit = defineEmits(['update:modelValue', 'save'])

const store = useCommunityStore()
const { addServer, updateServer } = store

const isEditMode = computed(() => !!props.initialData)

// Form State
const form = ref({
  name: '',
  ip: '',
  port: '',
  rconPassword: ''
})

const errors = ref({})

// Reset or Fill form on open
watch(() => props.modelValue, (val) => {
  if (val) {
    errors.value = {}
    if (props.initialData) {
      form.value = { ...props.initialData }
    } else {
      form.value = { name: '', ip: '', port: '27015', rconPassword: '' }
    }
  }
})

const validate = () => {
  const errs = {}
  if (!form.value.name) errs.name = '请输入服务器名称'
  if (!form.value.ip) errs.ip = '请输入 IP 地址'
  if (!form.value.port) errs.port = '请输入端口'
  // Mock Regex for IP validation could go here
  errors.value = errs
  return Object.keys(errs).length === 0
}

const closeModal = () => {
  emit('update:modelValue', false)
}

const handleSave = () => {
  if (!validate()) return

  if (isEditMode.value) {
    updateServer(props.groupId, props.initialData.id, form.value)
  } else {
    // Basic Add
    addServer(props.groupId, form.value)
  }
  
  emit('save')
}
</script>

<template>
  <div v-if="modelValue" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div @click="closeModal" class="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"></div>

    <!-- Modal Content -->
    <div class="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 transform transition-all scale-100">
      <h3 class="text-xl font-bold text-white mb-6">
        {{ isEditMode ? '修改服务器配置' : '添加新服务器' }}
      </h3>
      
      <div class="space-y-4">
        <!-- Name -->
        <div>
          <label class="block text-sm font-medium text-slate-400 mb-1">服务器显示名称</label>
          <input 
            v-model="form.name"
            type="text" 
            placeholder="例如: 僵尸逃跑 #1"
            class="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            :class="errors.name ? 'border-red-500' : ''"
          />
          <p v-if="errors.name" class="text-red-500 text-xs mt-1">{{ errors.name }}</p>
        </div>

        <!-- IP & Port -->
        <div class="grid grid-cols-3 gap-4">
          <div class="col-span-2">
            <label class="block text-sm font-medium text-slate-400 mb-1">IP 地址 / 域名</label>
            <input 
              v-model="form.ip"
              type="text" 
              placeholder="127.0.0.1"
              class="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              :class="errors.ip ? 'border-red-500' : ''"
            />
             <p v-if="errors.ip" class="text-red-500 text-xs mt-1">{{ errors.ip }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-400 mb-1">端口 (Port)</label>
             <input 
              v-model="form.port"
              type="text" 
              placeholder="27015"
              class="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              :class="errors.port ? 'border-red-500' : ''"
            />
             <p v-if="errors.port" class="text-red-500 text-xs mt-1">{{ errors.port }}</p>
          </div>
        </div>

        <!-- RCON -->
        <div>
          <label class="block text-sm font-medium text-slate-400 mb-1">RCON 密码</label>
           <input 
              v-model="form.rconPassword"
              type="password" 
              placeholder="建议定期更换密码"
              class="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p class="text-slate-500 text-xs mt-1">仅用于服务器通讯，不会公开显示。</p>
        </div>
      </div>

      <div class="mt-8 flex justify-end gap-3">
        <button 
          @click="closeModal"
          class="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
        >
          取消
        </button>
        <button 
          @click="handleSave"
          class="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-900/20"
        >
          {{ isEditMode ? '保存修改' : '确认添加' }}
        </button>
      </div>
    </div>
  </div>
</template>
