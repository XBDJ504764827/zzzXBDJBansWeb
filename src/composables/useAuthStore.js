import { ref, computed } from 'vue'
import api from '../utils/api'
import { useLogStore } from './useLogStore'

// State
const currentUser = ref(null)
const adminList = ref([])

export const useAuthStore = () => {

    // Login
    const login = async (username, password) => {
        try {
            const res = await api.post('/auth/login', { username, password })
            const { token, user } = res.data
            localStorage.setItem('token', token)
            localStorage.setItem('user', JSON.stringify(user)) // Simple cache
            currentUser.value = { ...user, token }
            return { success: true, user }
        } catch (error) {
            console.error(error)
            return { success: false, message: error.response?.data?.error || '登录失败' }
        }
    }

    // Restore Session from LocalStorage
    const checkAuth = async () => {
        const token = localStorage.getItem('token')
        const userStr = localStorage.getItem('user')
        if (token && userStr) {
            // Validate token with backend if strict, or just trust for UI state
            // For rigorous check, call /api/auth/me
            try {
                // await api.get('/auth/me') 
                currentUser.value = { ...JSON.parse(userStr), token }
                return true
            } catch (e) {
                logout()
                return false
            }
        }
        return false
    }

    const logout = async () => {
        try {
            await api.post('/auth/logout')
        } catch (e) { /* ignore */ }
        currentUser.value = null
        localStorage.removeItem('token')
        localStorage.removeItem('user')
    }

    // --- Admin Management Actions ---

    // const { addLog } = useLogStore() // If we want to log actions via frontend to API

    // Fetch Admins
    const fetchAdmins = async () => {
        try {
            const res = await api.get('/admins')
            adminList.value = res.data
        } catch (e) {
            console.error("Failed to fetch admins", e)
        }
    }

    // New Admin
    const addAdmin = async (adminData) => {
        try {
            await api.post('/admins', adminData)
            await fetchAdmins() // Refresh list

            // Log via backend logs endpoint manually if backend doesn't auto-log
            // Backend currently doesn't auto-log admin changes, so we can call log API
            // But usually backend should do it. For this "linkage" task, let's keep it simple.
            return { success: true }
        } catch (e) {
            return { success: false, message: e.response?.data || '添加失败' }
        }
    }

    // Update Admin
    const updateAdmin = async (id, updatedData) => {
        try {
            // Map to backend snake_case
            const payload = { ...updatedData }
            if (updatedData.steamId) {
                payload.steam_id = updatedData.steamId
                delete payload.steamId
            }
            // Remove empty password to prevent overwriting with empty string
            if (!payload.password) {
                delete payload.password
            }
            // Ensure empty strings are treated as null if backend expects optional? 
            // Current backend is Option<String>.

            await api.put(`/admins/${id}`, payload)

            // Update local state immediately for responsiveness or fetch
            await fetchAdmins()

            // Update current user if self
            if (currentUser.value && currentUser.value.id == id) { // Loose equality for string/int mix
                // We might need to re-login if password changed, but updating UI profile is enough
                Object.assign(currentUser.value, updatedData)
                localStorage.setItem('user', JSON.stringify(currentUser.value))
            }
            return { success: true }
        } catch (e) {
            return { success: false, message: e.response?.data || '更新失败' }
        }
    }

    // Delete Admin
    const deleteAdmin = async (id) => {
        try {
            await api.delete(`/admins/${id}`)
            await fetchAdmins()
            return { success: true }
        } catch (e) {
            return { success: false, message: e.response?.data || '删除失败' }
        }
    }

    // Change Password
    const changePassword = async (oldPassword, newPassword) => {
        try {
            const res = await api.post('/auth/change-password', {
                old_password: oldPassword,
                new_password: newPassword
            })
            return { success: true, message: res.data.message }
        } catch (e) {
            return { success: false, message: e.response?.data?.error || '修改失败' }
        }
    }

    const isSystemAdmin = computed(() => {
        return currentUser.value && currentUser.value.role === 'super_admin'
    })

    return {
        currentUser,
        adminList,
        isSystemAdmin,
        login,
        checkAuth,
        logout,
        fetchAdmins,
        addAdmin,
        updateAdmin,
        deleteAdmin,
        changePassword
    }
}
