import { ref } from 'vue'
import api from '../utils/api'

// State
const records = ref([])

export const usePlayerRecordStore = () => {

    const mapRecordFromBackend = (r) => ({
        id: r.id,
        playerName: r.player_name,
        steamId: r.steam_id,
        playerIp: r.player_ip,
        serverName: r.server_name,
        serverAddress: r.server_address,
        connectTime: r.connect_time
    })

    const fetchRecords = async (query = '') => {
        try {
            // Frontend might filter locally if no backend filter or send query param
            // Our backend `list_records` supports `?search=...` param
            const params = {}
            if (query) params.search = query

            const res = await api.get('/records', { params })
            records.value = res.data.map(mapRecordFromBackend)
        } catch (e) {
            console.error(e)
        }
    }

    return {
        records,
        fetchRecords
    }
}
