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

const durationSelect = ref('7d')
const customDate = ref('')
const customHour = ref('00')
const customMinute = ref('00')
const showHourSelect = ref(false)
const showMinuteSelect = ref(false)

const customTime = computed(() => {
    if (!customDate.value) return ''
    return `${customDate.value}T${customHour.value}:${customMinute.value}`
})

const minDate = computed(() => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().slice(0, 16)
})

const calculatedDurationPreview = computed(() => {
    if (!customTime.value) return ''
    const end = new Date(customTime.value)
    const now = new Date()
    const diffSeconds = Math.floor((end - now) / 1000)
    
    if (diffSeconds <= 0) return '无效时间 (需在未来)'

    // Simple formatting
    const d = Math.floor(diffSeconds / (24 * 3600))
    const h = Math.floor((diffSeconds % (24 * 3600)) / 3600)
    const m = Math.floor((diffSeconds % 3600) / 60)
    
    let parts = []
    if (d > 0) parts.push(`${d}天`)
    if (h > 0) parts.push(`${h}小时`)
    if (m > 0) parts.push(`${m}分`)
    if (parts.length === 0) parts.push(`${diffSeconds}秒`)
    
    return parts.join(' ')
})

// Initialize form when modal opens or initialData changes
watch(() => props.show, (newVal) => {
  if (newVal) {
    errors.value = { steamId: '', ip: '' }
    
    // Default values
    formData.value = {
        name: '',
        banType: 'account',
        steamId: '',
        ip: '',
        reason: '',
        duration: '7d'
    }
    durationSelect.value = '7d'
    customDate.value = ''
    customHour.value = '00'
    customMinute.value = '00'

    // If initialData is provided
    if (props.initialData && Object.keys(props.initialData).length > 0) {
        formData.value = { ...formData.value, ...props.initialData }
        
        // Handle duration display
        const dur = props.initialData.duration
        const isStandard = durationOptions.some(opt => opt.value === dur)
        if (isStandard) {
             durationSelect.value = dur
        } else {
             // If not standard (e.g. "12345s"), set to custom if we can? 
             // Or if editing an active ban, we might want to show it.
             // For now, if editing valid "12345s", we might just show custom placeholder or try to parse?
             // Simplest: Default to 7d or if it looks like seconds, show custom?
             // Let's just default to '7d' if not standard string match for simplicity unless simple logic.
             // But wait, if re-banning, we definitely want clean slate for time.
             // If editing active ban, we keep current. 
             durationSelect.value = '7d' 
        }
    }
  }
})

const handleDurationChange = () => {
    if (durationSelect.value === 'custom') {
        customHour.value = '00'
        customMinute.value = '00'
    }
}

const toggleHourSelect = () => {
    showHourSelect.value = !showHourSelect.value
    showMinuteSelect.value = false
}

const toggleMinuteSelect = () => {
    showMinuteSelect.value = !showMinuteSelect.value
    showHourSelect.value = false
}

const selectHour = (h) => {
    customHour.value = String(h).padStart(2, '0')
    showHourSelect.value = false
}

const selectMinute = (m) => {
    customMinute.value = String(m).padStart(2, '0')
    showMinuteSelect.value = false
}

const closeSelects = () => {
    showHourSelect.value = false
    showMinuteSelect.value = false
}

const validateSteamId = (id) => {
  // Relaxed validation: Allow any non-empty string. 
  // Backend handles resolution of SteamID64/3/2, Profile URLs, Vanity URLs etc.
  return id && id.trim().length > 0;
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

    if (durationSelect.value === 'custom' && !customTime.value) {
        alert('请选择自定义解封时间')
        isValid = false
    }

    if (!isValid) return

    // Calculate duration
    let finalDuration = durationSelect.value
    if (durationSelect.value === 'custom') {
        const end = new Date(customTime.value)
        const now = new Date()
        const diffSeconds = Math.floor((end - now) / 1000)
        
        if (diffSeconds <= 0) {
            return alert('解封时间必须在未来')
        }
        finalDuration = `${diffSeconds}s`
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
                 v-model="durationSelect"
                 class="flex-1 bg-[#14161b] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                 @change="handleDurationChange"
               >
                 <option v-for="opt in durationOptions" :key="opt.value" :value="opt.value">
                   {{ opt.label }}
                 </option>
               </select>
           </div>
           
           <!-- Custom Time Picker -->
           <div v-if="durationSelect === 'custom'" class="mt-2 animate-fade-in p-3 bg-white/5 rounded-lg border border-white/5 space-y-3">
                <!-- Ban Time (Read-only) -->
                <div>
                    <label class="block text-xs font-medium text-gray-400 mb-1">封禁时间 (当前)</label>
                    <div class="w-full bg-[#14161b]/50 border border-white/5 rounded-lg px-3 py-2 text-gray-400 text-sm font-mono cursor-not-allowed">
                        {{ new Date().toLocaleString() }}
                    </div>
                </div>

                <!-- Unban Time (Selectable) -->
                 <div class="space-y-2">
                      <label class="block text-xs font-medium text-gray-400">解封时间 (日期 + 时间)</label>
                      <div class="flex gap-2">
                        <input 
                            v-model="customDate"
                            type="date"
                            class="flex-1 bg-[#14161b] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        >
                        <!-- Custom Time Selectors -->
                        <div class="flex items-center gap-2 relative">
                            <!-- Backdrop for closing dropdowns -->
                            <div v-if="showHourSelect || showMinuteSelect" class="fixed inset-0 z-10" @click="closeSelects"></div>

                            <!-- Hour Selector -->
                            <div class="relative w-20 z-20">
                                <div 
                                    @click="toggleHourSelect"
                                    class="w-full bg-[#14161b] border border-white/10 rounded-lg px-3 py-2 text-white cursor-pointer flex justify-between items-center hover:border-white/20 transition-colors"
                                >
                                    <span>{{ customHour }}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 transition-transform" :class="{'rotate-180': showHourSelect}" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                                    </svg>
                                </div>
                                <div v-if="showHourSelect" class="absolute top-full left-0 w-full mt-1 bg-[#1e222b] border border-white/10 rounded-lg shadow-xl max-h-48 overflow-y-auto no-scrollbar">
                                    <div 
                                        v-for="h in 24" 
                                        :key="h-1"
                                        @click="selectHour(h-1)"
                                        class="px-3 py-2 hover:bg-blue-600 cursor-pointer text-center text-sm"
                                        :class="{'bg-blue-600/20 text-blue-400': customHour === String(h-1).padStart(2, '0')}"
                                    >
                                        {{ String(h-1).padStart(2, '0') }}
                                    </div>
                                </div>
                            </div>

                            <span class="text-gray-500 font-bold">:</span>

                            <!-- Minute Selector -->
                            <div class="relative w-20 z-20">
                                <div 
                                    @click="toggleMinuteSelect"
                                    class="w-full bg-[#14161b] border border-white/10 rounded-lg px-3 py-2 text-white cursor-pointer flex justify-between items-center hover:border-white/20 transition-colors"
                                >
                                    <span>{{ customMinute }}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 transition-transform" :class="{'rotate-180': showMinuteSelect}" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                                    </svg>
                                </div>
                                <div v-if="showMinuteSelect" class="absolute top-full left-0 w-full mt-1 bg-[#1e222b] border border-white/10 rounded-lg shadow-xl max-h-48 overflow-y-auto no-scrollbar">
                                    <div 
                                        v-for="m in 60" 
                                        :key="m-1"
                                        @click="selectMinute(m-1)"
                                        class="px-3 py-2 hover:bg-blue-600 cursor-pointer text-center text-sm"
                                        :class="{'bg-blue-600/20 text-blue-400': customMinute === String(m-1).padStart(2, '0')}"
                                    >
                                        {{ String(m-1).padStart(2, '0') }}
                                    </div>
                                </div>
                            </div>
                        </div>
                      </div>
                 </div>

                <!-- Dynamic calculation preview -->
                <div v-if="customTime" class="text-xs text-blue-400 flex items-center gap-1 pt-1 border-t border-white/5">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                         <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                    </svg>
                    <span>预计封禁时长: {{ calculatedDurationPreview }}</span>
                </div>
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
