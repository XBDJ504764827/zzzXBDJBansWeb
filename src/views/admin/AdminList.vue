<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../../composables/useAuthStore'
import AdminModal from '../../components/AdminModal.vue'

const { adminList, isSystemAdmin, addAdmin, updateAdmin, deleteAdmin, currentUser } = useAuthStore()

const showModal = ref(false)
const editMode = ref(false)
const currentAdmin = ref({})

const openAddModal = () => {
    editMode.value = false
    currentAdmin.value = null
    showModal.value = true
}

const openEditModal = (admin) => {
    editMode.value = true
    currentAdmin.value = { ...admin }
    showModal.value = true
}

const handleDelete = (id) => {
    if (confirm('确定要删除该管理员吗？')) {
        const result = deleteAdmin(id)
        if (!result.success) {
            alert(result.message)
        }
    }
}

const handleSubmit = (formData) => {
    let result
    if (editMode.value) {
        result = updateAdmin(currentAdmin.value.id, formData)
    } else {
        result = addAdmin(formData)
    }

    if (result.success) {
        showModal.value = false
    } else {
        alert(result.message)
    }
}

const getRoleLabel = (role) => {
    return role === 'super_admin' ? '系统级管理员' : '普通管理员'
}

const getRoleClass = (role) => {
    return role === 'super_admin' 
        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
        : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-white">管理员管理</h1>
        <p class="text-gray-400 text-sm mt-1">
            当前身份: <span class="text-white font-medium">{{ currentUser?.username }}</span>
            <span class="ml-2 text-xs px-2 py-0.5 rounded border" :class="getRoleClass(currentUser?.role)">
                {{ getRoleLabel(currentUser?.role) }}
            </span>
        </p>
      </div>
      
      <!-- Permission Check: Only super_admin can add -->
      <button 
        v-if="isSystemAdmin"
        @click="openAddModal"
        class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all shadow-lg shadow-blue-500/20"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        <span>新增管理员</span>
      </button>
    </div>

    <!-- Admin List -->
    <div class="bg-[#1a1d24] border border-white/5 rounded-xl overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
                <thead>
                    <tr class="border-b border-white/5 bg-white/5">
                        <th class="px-6 py-4 font-medium text-gray-300">用户名</th>
                        <th class="px-6 py-4 font-medium text-gray-300">身份</th>
                        <th class="px-6 py-4 font-medium text-gray-300">SteamID</th>
                        <th class="px-6 py-4 font-medium text-gray-300">创建时间</th>
                        <th v-if="isSystemAdmin" class="px-6 py-4 font-medium text-gray-300 text-right">操作</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                    <tr v-for="admin in adminList" :key="admin.id" class="hover:bg-white/5 transition-colors">
                        <td class="px-6 py-4">
                            <div class="font-medium text-white">{{ admin.username }}</div>
                        </td>
                        <td class="px-6 py-4">
                            <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium border" :class="getRoleClass(admin.role)">
                                {{ getRoleLabel(admin.role) }}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-gray-400 font-mono">{{ admin.steamId }}</td>
                        <td class="px-6 py-4 text-gray-400">{{ new Date(admin.createTime).toLocaleDateString() }}</td>
                        
                         <!-- Permission Check: Only super_admin can edit/delete -->
                        <td v-if="isSystemAdmin" class="px-6 py-4 text-right">
                             <div class="flex items-center justify-end gap-2">
                                <button 
                                    @click="openEditModal(admin)"
                                    class="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                    title="编辑"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                </button>
                                <button 
                                    @click="handleDelete(admin.id)"
                                    class="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                                    title="删除"
                                    :disabled="currentUser?.id === admin.id"
                                    :class="{'opacity-50 cursor-not-allowed': currentUser?.id === admin.id}"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                                    </svg>
                                </button>
                             </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <AdminModal 
        :show="showModal"
        :edit-mode="editMode"
        :initial-data="currentAdmin"
        @close="showModal = false"
        @submit="handleSubmit"
    />
  </div>
</template>
