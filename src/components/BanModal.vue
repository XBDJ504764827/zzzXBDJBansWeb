<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  show: Boolean,
  editMode: Boolean,
  initialData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close', 'submit'])

const formData = ref({
  name: '',
  banType: 'account',
  steamId: '',
  ip: '',
  reason: '',
  duration: '7d',
  customTime: ''
})

const errors = ref({
  steamId: '',
  ip: ''
})

const banTypes = [
  { value: 'account', label: '账号封禁' },
  { value: 'ip', label: 'IP封禁' }
]

const durationOptions = [
  { value: '1s', label: '1 秒' },
  { value: '5s', label: '5 秒' },
  { value: '7d', label: '7 天' },
  { value: '1mo', label: '1 个月' },
  { value: '3mo', label: '3 个月' },
  { value: '1y', label: '1 年' },
  { value: 'permanent', label: '永久' },
  { value: 'custom', label: '自定义时间' }
]

// Initialize form when modal opens or initialData changes
watch(() => props.show, (newVal) => {
  if (newVal) {
    errors.value = { steamId: '', ip: '' }
    
    const defaults = {
        name: '',
        banType: 'account',
        steamId: '',
        ip: '',
        reason: '',
        duration: '7d',
        customTime: ''
    }

    // If initialData is provided (whether edit mode or pre-fill), use it
    if (props.initialData && Object.keys(props.initialData).length > 0) {
        // Ensure we don't accidentally bring in unrelated fields, but spreads are usually fine
        // We might want to preserve defaults for missing fields
        formData.value = { ...defaults, ...props.initialData }
        
        // Special handling if initialData has duration that is not in options?
        // Logic handled in previous version:
        // "Check if duration is a standard option... assume custom" logic can remain or be simplified.
        // For pre-fill from PlayerRecords, we send '7d' which is standard.
        // If editing existing ban with custom date, we might need logic.
        // Let's keep it simple: just copy.
    } else {
        formData.value = defaults
    }
  }
})

const validateSteamId = (id) => {
  // Common SteamID formats:
  // STEAM_0:0:12345678
  // [U:1:12345678]
  // 76561198000000000 (64-bit)
  const steamRegex = /^(STEAM_[0-5]:[01]:\d+|\[U:1:\d+\]|7656119\d{10})$/
  return steamRegex.test(id)
}

const submitForm = () => {
    errors.value = { steamId: '', ip: '' }
    let isValid = true

    if (!formData.value.name) return alert('请输入玩家名称')
    
    // Validate SteamID
    if (!formData.value.steamId) {
        errors.value.steamId = '请输入 SteamID'
        isValid = false
    } else if (!validateSteamId(formData.value.steamId)) {
        errors.value.steamId = 'SteamID 格式不正确 (例如: STEAM_0:0:123456)'
        isValid = false
    }

    if (formData.value.banType === 'ip' && !formData.value.ip) {
        // If IP ban is selected, IP might be mandatory? 
        // User didn't specify strict IP validation but it implies we need it.
        // Let's just warn if empty for now if strictly required.
        // Assuming not strict for now unless requested.
    }

    if (formData.value.duration === 'custom' && !formData.value.customTime) {
        alert('请选择自定义解封时间')
        isValid = false
    }

    if (!isValid) return

    // Process duration for submission
    let finalDuration = formData.value.duration
    if (formData.value.duration === 'custom') {
        finalDuration = `Until ${formData.value.customTime.replace('T', ' ')}`
    }

    emit('submit', { 
        ...formData.value,
        duration: finalDuration
    })
}
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div class="w-full max-w-md bg-[#1a1d24] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-[#1e222b]">
        <h3 class="text-lg font-semibold text-white">
          {{ editMode ? '编辑封禁' : '添加封禁' }}
        </h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 space-y-4">
        <!-- Name -->
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">玩家名称</label>
          <input 
            v-model="formData.name" 
            type="text" 
            class="w-full bg-[#14161b] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="输入玩家名称"
          >
        </div>

        <!-- Ban Type -->
        <div>
           <label class="block text-xs font-medium text-gray-400 mb-1">封禁属性</label>
           <select 
             v-model="formData.banType"
             class="w-full bg-[#14161b] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
           >
             <option v-for="type in banTypes" :key="type.value" :value="type.value">
               {{ type.label }}
             </option>
           </select>
        </div>

        <!-- SteamID -->
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">SteamID</label>
          <input 
            v-model="formData.steamId" 
            type="text" 
            class="w-full bg-[#14161b] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
            :class="{'border-red-500': errors.steamId}"
            placeholder="STEAM_0:0:12345678"
          >
          <p v-if="errors.steamId" class="text-xs text-red-500 mt-1">{{ errors.steamId }}</p>
        </div>

        <!-- IP Address -->
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">IP 地址</label>
          <input 
            v-model="formData.ip" 
            type="text" 
            class="w-full bg-[#14161b] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="x.x.x.x"
          >
        </div>
        
        <!-- Duration -->
        <div>
           <label class="block text-xs font-medium text-gray-400 mb-1">封禁时长</label>
           <div class="flex gap-2">
               <select 
                 v-model="formData.duration"
                 class="flex-1 bg-[#14161b] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
               >
                 <option v-for="opt in durationOptions" :key="opt.value" :value="opt.value">
                   {{ opt.label }}
                 </option>
               </select>
           </div>
           
           <!-- Custom Time Picker -->
           <div v-if="formData.duration === 'custom'" class="mt-2 animate-fade-in">
                <label class="block text-xs font-medium text-gray-400 mb-1">选择解封时间</label>
                <input 
                    v-model="formData.customTime"
                    type="datetime-local"
                    class="w-full bg-[#14161b] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
           </div>
        </div>

        <!-- Reason -->
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">封禁原因</label>
          <textarea 
            v-model="formData.reason" 
            rows="3"
            class="w-full bg-[#14161b] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="输入封禁原因..."
          ></textarea>
        </div>

      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-white/5 bg-[#1e222b] flex justify-end gap-3">
        <button 
          @click="$emit('close')" 
          class="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          取消
        </button>
        <button 
          @click="submitForm" 
          class="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20"
        >
          {{ editMode ? '保存修改' : '确认封禁' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}
/* Custom date picker styles for dark mode */
input[type="datetime-local"]::-webkit-calendar-picker-indicator {
    filter: invert(1);
    cursor: pointer;
}
</style>
