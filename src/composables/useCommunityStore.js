import { ref, computed } from 'vue'

// Global state (singleton pattern for simple mock store)
const serverGroups = ref([])

export const useCommunityStore = () => {
    
    // Core Actions
    const addServerGroup = (name) => {
        const newGroup = {
            id: Date.now().toString(),
            name,
            servers: []
        }
        serverGroups.value.push(newGroup)
        return newGroup
    }

    const removeServerGroup = (groupId) => {
        const index = serverGroups.value.findIndex(g => g.id === groupId)
        if (index !== -1) {
            serverGroups.value.splice(index, 1)
        }
    }

    const addServer = (groupId, serverData) => {
        const group = serverGroups.value.find(g => g.id === groupId)
        if (!group) return false

        const newServer = {
            id: Date.now().toString(), // Simple ID generation
            ...serverData,
            status: 'online' // Mock status
        }
        
        group.servers.push(newServer)
        return newServer
    }

    const updateServer = (groupId, serverId, serverData) => {
        const group = serverGroups.value.find(g => g.id === groupId)
        if (!group) return false
        
        const serverIndex = group.servers.findIndex(s => s.id === serverId)
        if (serverIndex !== -1) {
            group.servers[serverIndex] = { ...group.servers[serverIndex], ...serverData }
            return true
        }
        return false
    }

    const removeServer = (groupId, serverId) => {
        const group = serverGroups.value.find(g => g.id === groupId)
        if (!group) return false
        
        const index = group.servers.findIndex(s => s.id === serverId)
        if (index !== -1) {
            group.servers.splice(index, 1)
            return true
        }
        return false
    }

    // Getters / Computed
    const hasCommunity = computed(() => serverGroups.value.length > 0)

    return {
        serverGroups,
        hasCommunity,
        addServerGroup,
        removeServerGroup,
        addServer,
        updateServer,
        removeServer
    }
}
