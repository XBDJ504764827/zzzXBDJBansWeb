import { ref } from 'vue'
import api from '../utils/api'

// State
const bans = ref([])

export const useBanStore = () => {

    const mapBanFromBackend = (b) => ({
        id: b.id,
        name: b.name,
        steamId: b.steam_id,
        ip: b.ip,
        banType: b.ban_type, // "account" or "ip"
        reason: b.reason,
        duration: b.duration,
        status: b.status,
        adminName: b.admin_name,
        createTime: b.created_at,
        expiresAt: b.expires_at
    })

    const fetchBans = async () => {
        try {
            const res = await api.get('/bans')
            bans.value = res.data.map(mapBanFromBackend)
        } catch (e) {
            console.error(e)
        }
    }

    const addBan = async (banData) => {
        try {
            // Frontend banData matches backend EXPECTED payload?
            // Backend `CreateBanRequest`:
            // name, steam_id, ip, ban_type, reason, duration, admin_name
            // Frontend sends camelCase. We need to convert.
            const payload = {
                name: banData.name,
                steam_id: banData.steamId,
                ip: banData.ip,
                ban_type: banData.banType,
                reason: banData.reason,
                duration: banData.duration,
                admin_name: banData.adminName
            }
            await api.post('/bans', payload)
            await fetchBans()
            return { success: true }
        } catch (e) {
            console.error(e)
            return { success: false, message: e.response?.data || 'Failed' }
        }
    }

    const removeBan = async (id) => {
        // "Unban" -> Update status to 'unbanned'
        try {
            // Backend `UpdateBanRequest` accepts `status`.
            // Our previous Logic was `removeBan` implies unbanning.
            // Backend has `delete` handler too, but that's HARD delete.
            // "解除封禁" usually means setting status to unbanned.
            // Let's use PUT update status.
            await api.put(`/bans/${id}`, { status: 'unbanned' })
            await fetchBans()
            return true
        } catch (e) {
            console.error(e)
            return false
        }
    }

    const updateBan = async (id, updatedData) => {
        try {
            // Map frontend fields to backend fields if necessary
            // updatedData might contain reason, duration, etc.
            const payload = {}
            if (updatedData.status) payload.status = updatedData.status
            if (updatedData.name) payload.name = updatedData.name
            if (updatedData.steamId) payload.steam_id = updatedData.steamId
            if (updatedData.ip) payload.ip = updatedData.ip
            if (updatedData.banType) payload.ban_type = updatedData.banType
            if (updatedData.reason) payload.reason = updatedData.reason
            if (updatedData.duration) payload.duration = updatedData.duration

            await api.put(`/bans/${id}`, payload)
            await fetchBans()
            return true
        } catch (e) {
            console.error(e)
            return false
        }
    }

    // Hard delete (Super Admin only)
    const deleteBanRecord = async (id) => {
        try {
            await api.delete(`/bans/${id}`)
            await fetchBans()
            return true
        } catch (e) {
            console.error(e)
            return false
        }
    }

    return {
        bans,
        fetchBans,
        addBan,
        removeBan,
        updateBan,
        deleteBanRecord
    }
}
