import { ref, computed } from 'vue'
import api from '../utils/api'

// Global state
const serverGroups = ref([])

export const useCommunityStore = () => {

    // Fetch
    const fetchServerGroups = async () => {
        try {
            const res = await api.get('/server-groups')
            // Backend returns [{id, name, servers: [...]}] based on our handler
            serverGroups.value = res.data.map(g => ({
                ...g,
                servers: g.servers.map(s => ({
                    ...s,
                    status: 'unknown' // Default status until checked?
                }))
            }))

            // Check status for all servers asynchronously
            checkAllStatuses()

        } catch (e) {
            console.error(e)
        }
    }

    // Helper to check status for all loaded servers
    const checkAllStatuses = async () => {
        for (const group of serverGroups.value) {
            for (const server of group.servers) {
                // Don't await in loop to do parallel? 
                // Better to map promises.
                // But for simplicity in ref loop:
                checkOneServerStatus(group.id, server)
            }
        }
    }

    const checkOneServerStatus = async (groupId, server) => {
        try {
            await api.post('/servers/check', {
                ip: server.ip,
                port: server.port,
                rcon_password: server.rcon_password
            })
            // Update status to online
            updateLocalStatus(groupId, server.id, 'online')
        } catch (e) {
            updateLocalStatus(groupId, server.id, 'offline')
        }
    }

    const updateLocalStatus = (groupId, serverId, status) => {
        const group = serverGroups.value.find(g => g.id === groupId)
        if (group) {
            const s = group.servers.find(s => s.id === serverId)
            if (s) s.status = status
        }
    }

    // Server Groups
    const addServerGroup = async (name) => {
        try {
            await api.post('/server-groups', { name })
            await fetchServerGroups()
            return { success: true }
        } catch (e) {
            return { success: false, message: e.response?.data || '创建失败' }
        }
    }

    const removeServerGroup = async (groupId) => {
        try {
            await api.delete(`/server-groups/${groupId}`)
            await fetchServerGroups()
            return { success: true }
        } catch (e) {
            return { success: false, message: '删除失败' }
        }
    }

    // Servers
    const addServer = async (groupId, serverData) => {
        try {
            await api.post('/servers', { group_id: groupId, ...serverData })
            await fetchServerGroups()
            return { success: true }
        } catch (e) {
            return { success: false, message: e.response?.data || '添加失败' }
        }
    }

    const updateServer = async (groupId, serverId, serverData) => {
        try {
            await api.put(`/servers/${serverId}`, serverData)
            await fetchServerGroups()
            return { success: true }
        } catch (e) {
            return { success: false, message: e.response?.data || '更新失败' }
        }
    }

    const removeServer = async (groupId, serverId) => {
        try {
            await api.delete(`/servers/${serverId}`)
            await fetchServerGroups()
            return { success: true }
        } catch (e) {
            return { success: false, message: '删除失败' }
        }
    }

    // Check Server Status (RCON)
    const checkServer = async (connectionInfo) => {
        try {
            // connectionInfo: { ip, port, rcon_password }
            await api.post('/servers/check', connectionInfo)
            return { success: true }
        } catch (e) {
            return { success: false, message: e.response?.data || '连接失败' }
        }
    }

    // Getters / Computed
    const hasCommunity = computed(() => serverGroups.value.length > 0)

    return {
        serverGroups,
        hasCommunity,
        fetchServerGroups,
        addServerGroup,
        removeServerGroup,
        addServer,
        updateServer,
        removeServer,
        checkServer
    }
}
