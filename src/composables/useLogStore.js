import { ref } from 'vue'

// Mock Data
const logs = ref([
    {
        id: '1',
        time: new Date(Date.now() - 86400000).toISOString(),
        admin: 'admin',
        action: '登录',
        target: 'System',
        details: '系统初始化登录'
    }
])

export const useLogStore = () => {

    // admin: Operator Name
    // action: 'Create', 'Update', 'Delete', 'Ban', 'Unban', etc.
    // target: Target Object Name (e.g. Player Name, Admin User)
    // details: Extra info strings
    const addLog = ({ admin, action, target, details }) => {
        const newLog = {
            id: Date.now().toString(),
            time: new Date().toISOString(),
            admin: admin || 'Unknown',
            action,
            target,
            details
        }
        // Prepend to show newest first
        logs.value.unshift(newLog)
    }

    const clearLogs = () => {
        logs.value = []
    }

    return {
        logs,
        addLog,
        clearLogs
    }
}
