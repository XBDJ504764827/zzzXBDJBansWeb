<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../composables/useAuthStore'

const props = defineProps({
  isOpen: Boolean
})

const emit = defineEmits(['close'])
const { changePassword } = useAuthStore()

const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const error = ref('')
const success = ref('')
const loading = ref(false)

const handleSubmit = async () => {
    error.value = ''
    success.value = ''
    
    if (newPassword.value !== confirmPassword.value) {
        error.value = '两次输入的密码不一致'
        return
    }
    
    if (newPassword.value.length < 3) {
        error.value = '新密码长度至少为3位'
        return
    }

    loading.value = true
    const res = await changePassword(oldPassword.value, newPassword.value)
    loading.value = false
    
    if (res.success) {
        success.value = '密码修改成功'
        oldPassword.value = ''
        newPassword.value = ''
        confirmPassword.value = ''
        setTimeout(() => {
            emit('close')
        }, 1500)
    } else {
        error.value = res.message || '修改失败'
    }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="fixed inset-0 bg-black/70 backdrop-blur-sm" @click="$emit('close')"></div>
    <div class="relative bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md p-6">
      <h3 class="text-xl font-bold text-white mb-6">修改密码</h3>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
           <label class="block text-sm font-medium text-slate-400 mb-1">当前密码</label>
           <input type="password" v-model="oldPassword" required 
             class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
        </div>
        
        <div>
           <label class="block text-sm font-medium text-slate-400 mb-1">新密码</label>
           <input type="password" v-model="newPassword" required 
             class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
        </div>

        <div>
           <label class="block text-sm font-medium text-slate-400 mb-1">确认新密码</label>
           <input type="password" v-model="confirmPassword" required 
             class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
        </div>

        <div v-if="error" class="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg">{{ error }}</div>
        <div v-if="success" class="text-green-400 text-sm bg-green-400/10 p-3 rounded-lg">{{ success }}</div>

        <div class="flex justify-end gap-3 mt-6">
          <button type="button" @click="$emit('close')" 
            class="px-4 py-2 text-slate-400 hover:text-white transition-colors">
            取消
          </button>
          <button type="submit" :disabled="loading"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium disabled:opacity-50">
            {{ loading ? '提交中...' : '确认修改' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
