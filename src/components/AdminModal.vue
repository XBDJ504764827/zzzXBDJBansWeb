<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  show: Boolean,
  editMode: Boolean,
  initialData: {
    type: Object,
    default: () => ({})
  },
  disableRole: Boolean
})

const emit = defineEmits(['close', 'submit'])

const formData = ref({
  username: '',
  password: '',
  role: 'admin',
  username: '',
  password: '',
  role: 'admin',
  steamId: '',
  remark: ''
})

const errors = ref({
    username: '',
    password: '',
    steamId: ''
})

const roleOptions = [
    { value: 'admin', label: '普通管理员' },
    { value: 'super_admin', label: '系统级管理员' }
]

watch(() => props.show, (newVal) => {
  if (newVal) {
     errors.value = { username: '', password: '', steamId: '' }
    if (props.editMode && props.initialData) {
      formData.value = { 
          username: props.initialData.username,
          password: '', // Leave empty for edit
          role: props.initialData.role,
          steamId: props.initialData.steamId,
          remark: props.initialData.remark || ''
      }
    } else {
      formData.value = {
        username: '',
        password: '',
        role: 'admin',
        steamId: '',
        remark: ''
      }
    }
  }
})

const validateSteamId = (id) => {
  const steamRegex = /^(STEAM_[0-5]:[01]:\d+|\[U:1:\d+\]|7656119\d{10})$/
  return steamRegex.test(id)
}

const submitForm = () => {
    errors.value = { username: '', password: '', steamId: '' }
    let isValid = true

    if (!formData.value.username) {
        errors.value.username = '请输入用户名'
        isValid = false
    }

    if (!props.editMode && !formData.value.password) {
        errors.value.password = '请输入密码'
        isValid = false
    }



    if (formData.value.steamId && !validateSteamId(formData.value.steamId)) {
        errors.value.steamId = '格式错误 (如: STEAM_0:0:123456)'
        isValid = false
    }

    if (isValid) {
        emit('submit', { ...formData.value })
    }
}
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div class="w-full max-w-md bg-white dark:bg-[#1a1d24] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden transition-colors">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-white/5 flex justify-between items-center bg-gray-50 dark:bg-[#1e222b] transition-colors">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
          {{ editMode ? '编辑管理员' : '新增管理员' }}
        </h3>
        <button @click="$emit('close')" class="text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>

      <div class="p-6 space-y-4">
        <!-- Username -->
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">用户名</label>
          <input 
            v-model="formData.username" 
            type="text" 
             class="w-full bg-gray-50 dark:bg-[#14161b] border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
             :class="{'border-red-500': errors.username}"
            placeholder="登录账号"
          >
          <p v-if="errors.username" class="text-xs text-red-500 mt-1">{{ errors.username }}</p>
        </div>

        <!-- Password -->
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">密码</label>
          <input 
            v-model="formData.password" 
            type="text" 
            class="w-full bg-gray-50 dark:bg-[#14161b] border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
            :class="{'border-red-500': errors.password}"
            placeholder="登录密码 (留空则不修改)"
          >
          <p v-if="errors.password" class="text-xs text-red-500 mt-1">{{ errors.password }}</p>
        </div>

        <!-- Role -->
        <div>
           <label class="block text-xs font-medium text-gray-400 mb-1">权限等级</label>
           <select 
             v-model="formData.role"
             :disabled="disableRole"
             class="w-full bg-gray-50 dark:bg-[#14161b] border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
           >
             <option v-for="opt in roleOptions" :key="opt.value" :value="opt.value">
               {{ opt.label }}
             </option>
           </select>
           <p class="text-xs text-gray-500 mt-1" v-if="formData.role === 'super_admin'">系统级管理员拥有所有权限。</p>
           <p class="text-xs text-gray-500 mt-1" v-else>普通管理员仅能查看列表。</p>
        </div>

        <!-- Remark -->
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">备注 (选填)</label>
          <input 
            v-model="formData.remark" 
            type="text" 
            class="w-full bg-gray-50 dark:bg-[#14161b] border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="管理员备注信息"
          >
        </div>

        <!-- SteamID -->
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1">SteamID</label>
          <input 
            v-model="formData.steamId" 
            type="text" 
            class="w-full bg-gray-50 dark:bg-[#14161b] border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
            :class="{'border-red-500': errors.steamId}"
            placeholder="绑定 SteamID"
          >
          <p v-if="errors.steamId" class="text-xs text-red-500 mt-1">{{ errors.steamId }}</p>
        </div>
      </div>

      <div class="px-6 py-4 border-t border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-[#1e222b] flex justify-end gap-3 transition-colors">
        <button 
          @click="$emit('close')" 
          class="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          取消
        </button>
        <button 
          @click="submitForm" 
          class="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20"
        >
          {{ editMode ? '保存' : '创建' }}
        </button>
      </div>
    </div>
  </div>
</template>
