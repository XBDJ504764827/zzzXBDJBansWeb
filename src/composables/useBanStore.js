import { ref } from 'vue'
import { useLogStore } from './useLogStore'

// Mock Data
const bans = ref([])

export const useBanStore = () => {

    const { addLog } = useLogStore()

    const addBan = (banData) => {
        const newBan = {
            id: Date.now().toString(),
            createTime: new Date().toISOString(),
            status: 'active', // active, expired, unbanned
            ...banData
        }
        bans.value.push(newBan)
        addLog({
            admin: banData.adminName,
            action: '新增封禁',
            target: banData.name,
            details: `SteamID: ${banData.steamId}, 原因: ${banData.reason}`
        })
        return newBan
    }

    const removeBan = (id) => {
        const index = bans.value.findIndex(b => b.id === id)
        if (index !== -1) {
            const ban = bans.value[index]
            bans.value[index].status = 'unbanned'
            // We need to know WHO unbanned. 
            // Currently removeBan only implies id. 
            // In a real app the controller knows headers.
            // For mock, we'll log as 'Unknown (System)' or change signature later.
            // Let's rely on frontend calling code to maybe inject current user? 
            // Or just leave "Unknown" for now as signature change is larger refactor.
            // Wait, I can import useAuthStore here if I want implicit current user logging
            // But let's keep it simple. If we want better logging, we should pass admin name.
            // But previous requirement didn't ask to change unban signature.
            // I'll assume current active user if useAuthStore works here. 
            // Let's try importing useAuthStore dynamically to avoid circular dep issues inside functions if needed,
            // or just import at top. Circular dep is risky. 
            // I will use 'System/Admin' for now to be safe or just log the action.
            addLog({
                admin: 'System/Admin',
                action: '解除封禁',
                target: ban.name,
                details: `ID: ${id}`
            })
            return true
        }
        return false
    }

    const updateBan = (id, updatedData) => {
        const index = bans.value.findIndex(b => b.id === id)
        if (index !== -1) {
            bans.value[index] = { ...bans.value[index], ...updatedData }
            addLog({
                admin: 'System/Admin',
                action: '编辑封禁',
                target: bans.value[index].name,
                details: `Updated fields: ${Object.keys(updatedData).join(', ')}`
            })
            return true
        }
        return false
    }

    return {
        bans,
        addBan,
        removeBan,
        updateBan
    }
}
