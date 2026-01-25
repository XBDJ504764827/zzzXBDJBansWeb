import { ref } from 'vue'

// Mock Data
const bans = ref([])

export const useBanStore = () => {

    const addBan = (banData) => {
        const newBan = {
            id: Date.now().toString(),
            createTime: new Date().toISOString(),
            status: 'active', // active, expired, unbanned
            ...banData
        }
        bans.value.push(newBan)
        return newBan
    }

    const removeBan = (id) => {
        const index = bans.value.findIndex(b => b.id === id)
        if (index !== -1) {
            // Instead of deleting, we might want to set status to unbanned, 
            // but for "remove" request usually implies deletion or unbanning.
            // Let's implement unban as status change and remove as deletion if needed.
            // Requirement says "解除封禁" (Unban), usually just changing status.
            // But let's support delete too if needed, or just make removeBan do the unban logic.
            // Let's make a specific unban function.
            bans.value[index].status = 'unbanned'
            return true
        }
        return false
    }

    const updateBan = (id, updatedData) => {
        const index = bans.value.findIndex(b => b.id === id)
        if (index !== -1) {
            bans.value[index] = { ...bans.value[index], ...updatedData }
            return true
        }
        return false
    }

    return {
        bans,
        addBan,
        removeBan, // This acts as unban for now based on logic above
        updateBan
    }
}
