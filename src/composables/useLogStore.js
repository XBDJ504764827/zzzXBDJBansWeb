import { ref } from 'vue'
import api from '../utils/api'

// State
const logs = ref([])

export const useLogStore = () => {

    const mapLogFromBackend = (l) => ({
        id: l.id,
        time: l.created_at,
        admin: l.admin_username,
        action: l.action,
        target: l.target,
        details: l.details
    })

    const fetchLogs = async () => {
        try {
            const res = await api.get('/logs')
            logs.value = res.data.map(mapLogFromBackend)
        } catch (e) {
            console.error(e)
        }
    }

    const addLog = async ({ admin, action, target, details }) => {
        try {
            await api.post('/logs', {
                admin_username: admin,
                action,
                target,
                details
            })
            // Optionally fetch logs immediately if we are viewing the log page
            // But usually this store is used by other components.
            // If they are on Log page, Log page should poll or refresh.
            // We can optimistic update but let's just trigger fetch if we want strict consistency.
            // await fetchLogs() 
        } catch (e) {
            console.error("Failed to log", e)
        }
    }

    const clearLogs = () => {
        logs.value = []
        // Backend doesn't support clear all via API yet?
    }

    return {
        logs,
        fetchLogs,
        addLog,
        clearLogs
    }
}
