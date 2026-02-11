<script setup>
import { ref, watch, computed } from 'vue'
import { useCommunityStore } from '@/composables/useCommunityStore'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  modelValue: Boolean,
  groupId: String,
  initialData: Object // Null if creating new, Object if editing
})

const emit = defineEmits(['update:modelValue', 'save'])

const store = useCommunityStore()
const { addServer, updateServer } = store
const toast = useToast()

const isEditMode = computed(() => !!props.initialData)

// Form State
const form = ref({
  name: '',
  ip: '',
  port: '',
  rcon_password: ''
})

const checkStatus = ref({
  loading: false,
  success: false,
  message: ''
})

const errors = ref({})

// Reset or Fill form on open
watch(() => props.modelValue, (val) => {
  if (val) {
    errors.value = {}
    if (props.initialData) {
      form.value = { 
          ...props.initialData,
          rcon_password: props.initialData.rcon_password || '',
          verification_enabled: props.initialData.verification_enabled !== false // Default true if undefined
      }
    } else {
      form.value = { name: '', ip: '', port: '27015', rcon_password: '', verification_enabled: true }
    }
  } else {
    // Reset check status on close
    checkStatus.value = { loading: false, success: false, message: '' }
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

const handleSave = async () => {
  if (!validate()) return

  // Prepare Payload
  const payload = {
      ...form.value,
      port: parseInt(form.value.port) // Ensure Int
  }

  let res;
  if (isEditMode.value) {
    res = await updateServer(props.groupId, props.initialData.id, payload)
  } else {
    // Basic Add
    res = await addServer(props.groupId, payload)
  }
  
  if (res.success) {
      toast.success(isEditMode.value ? '服务器更新成功' : '服务器添加成功')
      emit('save')
      closeModal()
  } else {
      toast.error(res.message || '操作失败')
  }
}

const handleCheck = async () => {
    checkStatus.value = { loading: true, success: false, message: '' }
    
    // Validate minimally
    if (!form.value.ip || !form.value.port) {
        checkStatus.value = { loading: false, success: false, message: '请先填写 IP 和 端口' }
        return
    }

    const res = await store.checkServer({
        ip: form.value.ip,
        port: parseInt(form.value.port),
        rcon_password: form.value.rcon_password
    })

    checkStatus.value = {
        loading: false,
        success: res.success,
        message: res.success ? '连接成功！服务器在线。' : (res.message || '连接失败')
    }
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
        
        <!-- Verification Toggle -->
        <div class="flex items-center gap-3 py-2">
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" v-model="form.verification_enabled" class="sr-only peer">
              <div class="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span class="ml-3 text-sm font-medium text-slate-300">启用入服资格验证</span>
            </label>
        </div>

        <!-- RCON -->
        <div>
          <label class="block text-sm font-medium text-slate-400 mb-1">RCON 密码</label>
           <div class="flex gap-2">
             <input 
                v-model="form.rcon_password"
                type="password" 
                placeholder="建议定期更换密码"
                class="flex-1 px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button 
                @click="handleCheck"
                :disabled="checkStatus.loading"
                class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {{ checkStatus.loading ? '连接中...' : '测试连接' }}
              </button>
           </div>
            <p class="text-slate-500 text-xs mt-1">仅用于服务器通讯，不会公开显示。</p>
            
            <!-- Check Result -->
            <div v-if="checkStatus.message" class="mt-2 text-sm flex items-center gap-2" :class="checkStatus.success ? 'text-green-400' : 'text-red-400'">
                <span v-if="checkStatus.success">●</span>
                <span v-else>✕</span>
                {{ checkStatus.message }}
            </div>
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
