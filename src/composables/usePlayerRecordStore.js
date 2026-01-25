import { ref } from 'vue'

// Mock Data
// 1. Player Name 2. SteamID 3. Player IP 4. Connect Time 5. Server Name 6. Server IP:Port
const records = ref([
    {
        id: '1',
        playerName: 'PlayerOne',
        steamId: 'STEAM_0:0:111000',
        playerIp: '192.168.1.101',
        connectTime: new Date(Date.now() - 3600000).toISOString(),
        serverName: 'Zombie Escape #1',
        serverAddress: '10.0.0.1:27015'
    },
    {
        id: '2',
        playerName: 'ProGamer',
        steamId: 'STEAM_0:1:222000',
        playerIp: '203.0.113.45',
        connectTime: new Date(Date.now() - 7200000).toISOString(),
        serverName: 'Zombie Escape #2',
        serverAddress: '10.0.0.2:27015'
    },
    {
        id: '3',
        playerName: 'NoobMaster',
        steamId: 'STEAM_0:0:333000',
        playerIp: '198.51.100.23',
        connectTime: new Date(Date.now() - 86400000).toISOString(),
        serverName: 'Zombie Escape #1',
        serverAddress: '10.0.0.1:27015'
    },
    {
        id: '4',
        playerName: 'PlayerOne', // Same player different time
        steamId: 'STEAM_0:0:111000',
        playerIp: '192.168.1.101',
        connectTime: new Date(Date.now() - 90000000).toISOString(),
        serverName: 'Zombie Escape #1',
        serverAddress: '10.0.0.1:27015'
    }
])

export const usePlayerRecordStore = () => {

    // In a real app, this would likely be an async fetch with server-side filtering
    // For mock, we'll just expose the list and let the view handle simple filtering

    return {
        records
    }
}
