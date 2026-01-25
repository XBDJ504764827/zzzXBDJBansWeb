import { ref, computed } from 'vue'
import { useLogStore } from './useLogStore'

// Mock Data Persistence (in memory for this session)
const adminList = ref([
    { id: '1', username: 'admin', password: 'password', role: 'super_admin', steamId: 'STEAM_0:0:111111', createTime: '2023-01-01T00:00:00.000Z' },
    { id: '2', username: 'user', password: '123', role: 'admin', steamId: 'STEAM_0:0:222222', createTime: '2023-01-02T00:00:00.000Z' }
])

const currentUser = ref(null)

export const useAuthStore = () => {

    const login = (username, password) => {
        const user = adminList.value.find(u => u.username === username && u.password === password)
        if (user) {
            currentUser.value = { ...user } // Store session
            return { success: true, user }
        }
        return { success: false, message: '用户名或密码错误' }
    }

    const logout = () => {
        currentUser.value = null
        // Cleanup tokens if any
    }

    // --- Admin Management Actions (Only available if current user is super_admin ideally, checked in UI/Logic) ---

    const { addLog } = useLogStore()

    // New Admin
    const addAdmin = (adminData) => {
        if (adminList.value.some(u => u.username === adminData.username)) {
            return { success: false, message: '用户名已存在' }
        }

        const newAdmin = {
            id: Date.now().toString(),
            createTime: new Date().toISOString(),
            ...adminData
        }
        adminList.value.push(newAdmin)

        addLog({
            admin: currentUser.value ? currentUser.value.username : 'System',
            action: '新增管理员',
            target: adminData.username,
            details: `Role: ${adminData.role}`
        })

        return { success: true, admin: newAdmin }
    }

    // Update Admin
    const updateAdmin = (id, updatedData) => {
        const index = adminList.value.findIndex(a => a.id === id)
        if (index !== -1) {
            // Check username conflict if resolved
            if (updatedData.username && updatedData.username !== adminList.value[index].username) {
                if (adminList.value.some(u => u.username === updatedData.username)) {
                    return { success: false, message: '用户名已存在' }
                }
            }

            const oldName = adminList.value[index].username
            adminList.value[index] = { ...adminList.value[index], ...updatedData }

            // Update current user if self-modifying
            if (currentUser.value && currentUser.value.id === id) {
                Object.assign(currentUser.value, updatedData)
            }

            addLog({
                admin: currentUser.value ? currentUser.value.username : 'System',
                action: '编辑管理员',
                target: oldName,
                details: `Updated info`
            })

            return { success: true }
        }
        return { success: false, message: '管理员不存在' }
    }

    // Delete Admin
    const deleteAdmin = (id) => {
        if (currentUser.value && currentUser.value.id === id) {
            return { success: false, message: '不能删除自己' }
        }

        const index = adminList.value.findIndex(a => a.id === id)
        if (index !== -1) {
            const removed = adminList.value[index]
            adminList.value.splice(index, 1)

            addLog({
                admin: currentUser.value ? currentUser.value.username : 'System',
                action: '删除管理员',
                target: removed.username,
                details: `Role: ${removed.role}`
            })
            return { success: true }
        }
        return { success: false, message: '管理员不存在' }
    }

    const isSystemAdmin = computed(() => {
        return currentUser.value && currentUser.value.role === 'super_admin'
    })

    return {
        currentUser,
        adminList,
        isSystemAdmin,
        login,
        logout,
        addAdmin,
        updateAdmin,
        deleteAdmin
    }
}
