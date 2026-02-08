<template>
    <div class="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
        <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8">
            <!-- Header -->
            <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800/60 pb-8">
                <div>
                    <h2 class="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 tracking-tight">
                        白名单公示
                    </h2>
                    <p class="mt-2 text-slate-400 text-lg">
                        实时查看申请进度与审核结果
                        <span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                            共 {{ list.length }} 条记录
                        </span>
                    </p>
                </div>
                <div>
                     <router-link to="/apply" class="group inline-flex items-center px-5 py-2.5 border border-indigo-500/30 rounded-xl shadow-[0_0_15px_-3px_rgba(99,102,241,0.2)] text-sm font-semibold text-white bg-indigo-600/10 hover:bg-indigo-600/20 hover:border-indigo-500/50 hover:shadow-indigo-500/20 backdrop-blur-sm transition-all duration-300">
                        <svg class="mr-2 -ml-1 h-5 w-5 text-indigo-400 group-hover:-translate-x-1 transition-transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        返回申请页面
                     </router-link>
                </div>
            </div>

            <!-- Controls (Search & Tabs) -->
            <div class="sticky top-4 z-20">
                <div class="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <!-- Status Tabs -->
                    <div class="flex p-1 space-x-1 bg-slate-950/50 rounded-xl border border-slate-800/50 overflow-x-auto max-w-full no-scrollbar">
                        <button 
                            v-for="tab in tabs" 
                            :key="tab.value"
                            @click="currentTab = tab.value"
                            :class="[
                                'px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap flex items-center gap-2',
                                currentTab === tab.value 
                                    ? 'bg-slate-800 text-white shadow-lg shadow-black/20 ring-1 ring-white/10' 
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                            ]"
                        >
                            <span :class="[
                                'w-2 h-2 rounded-full',
                                tab.value === 'approved' ? 'bg-emerald-400' :
                                tab.value === 'pending' ? 'bg-amber-400' :
                                tab.value === 'rejected' ? 'bg-rose-400' : 'bg-slate-400'
                            ]"></span>
                            {{ tab.label }} 
                            <span class="ml-1 text-xs opacity-60">
                                {{ getCount(tab.value) }}
                            </span>
                        </button>
                    </div>

                    <!-- Search Box -->
                    <div class="relative w-full md:w-80 group">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg class="h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <input 
                            v-model="searchQuery" 
                            type="text" 
                            class="block w-full pl-10 pr-3 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all shadow-inner" 
                            placeholder="搜索昵称 / SteamID..." 
                        />
                    </div>
                </div>
            </div>

            <!-- Content Area -->
            <div v-if="loading" class="flex flex-col items-center justify-center py-32 space-y-4">
                <div class="relative">
                    <div class="w-12 h-12 border-4 border-slate-800 rounded-full"></div>
                    <div class="w-12 h-12 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                </div>
                <p class="text-slate-500 animate-pulse">正在加载数据...</p>
            </div>

            <div v-else class="space-y-6">
                 <!-- Empty State -->
                <div v-if="filteredList.length === 0" class="flex flex-col items-center justify-center py-24 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
                    <div class="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                        <svg class="h-8 w-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <h3 class="text-lg font-medium text-slate-300">未找到相关记录</h3>
                    <p class="mt-1 text-slate-500">请尝试更换筛选条件或清除搜索关键词</p>
                    <button 
                        @click="clearFilters"
                        class="mt-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
                    >
                        清除所有筛选
                    </button>
                </div>

                <!-- Desktop Table View -->
                <div v-if="filteredList.length > 0" class="hidden md:block rounded-2xl border border-slate-800 overflow-hidden shadow-2xl bg-slate-900/40 backdrop-blur-sm">
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-slate-800/50">
                            <thead class="bg-slate-950/50">
                                <tr>
                                    <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">交互状态</th>
                                    <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">信息</th>
                                    <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">SteamID (64)</th>
                                    <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Other IDs</th>
                                    <th scope="col" class="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">申请时间</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-800/50 bg-slate-900/20">
                                <tr v-for="item in paginatedList" :key="item.id" class="hover:bg-indigo-500/5 transition-colors group">
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="flex items-center">
                                            <span :class="getStatusBadgeClass(item.status)" class="px-3 py-1 rounded-full text-xs font-medium border shadow-sm">
                                                {{ getStatusText(item.status) }}
                                            </span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">{{ item.name }}</div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <button 
                                            @click="copyToClipboard(item.steam_id_64 || item.steam_id)"
                                            class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/50 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all group/btn"
                                            title="点击复制 SteamID64"
                                        >
                                            <span class="font-mono text-xs text-slate-400 group-hover/btn:text-indigo-300">{{ item.steam_id_64 || item.steam_id }}</span>
                                            <svg class="h-3.5 w-3.5 text-slate-600 group-hover/btn:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="flex flex-col gap-1">
                                            <div v-if="item.steam_id" class="flex items-center gap-2">
                                                 <span class="text-[10px] text-slate-500 uppercase tracking-wider w-8">ID2</span>
                                                 <span class="font-mono text-xs text-slate-400 select-all">{{ item.steam_id }}</span>
                                            </div>
                                            <div v-if="item.steam_id_3" class="flex items-center gap-2">
                                                 <span class="text-[10px] text-slate-500 uppercase tracking-wider w-8">ID3</span>
                                                 <span class="font-mono text-xs text-slate-400 select-all">{{ item.steam_id_3 }}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-right">
                                        <div class="text-sm text-slate-400">{{ formatDate(item.created_at) }}</div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Mobile Card View -->
                <div v-if="filteredList.length > 0" class="md:hidden grid grid-cols-1 gap-4">
                    <div v-for="item in paginatedList" :key="item.id" class="bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-800 p-5 shadow-lg relative overflow-hidden group">
                        <!-- Left Border Status Indicator -->
                        <div class="absolute left-0 top-0 bottom-0 w-1" :class="getStatusBorderClass(item.status)"></div>
                        
                        <div class="flex justify-between items-start mb-4 pl-3">
                             <div>
                                <h3 class="text-lg font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">{{ item.name }}</h3>
                                <p class="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {{ formatDate(item.created_at) }}
                                </p>
                             </div>
                             <span :class="getStatusBadgeClass(item.status)" class="px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-sm">
                                {{ getStatusText(item.status) }}
                            </span>
                        </div>
                        
                        <!-- IDs Grid -->
                        <div class="pl-3 space-y-2">
                            <!-- ID64 (Primary) -->
                            <div class="bg-slate-950/50 rounded-lg p-2 border border-slate-800 flex justify-between items-center group/id">
                                <div class="flex flex-col">
                                    <span class="text-[10px] text-slate-500 uppercase tracking-wider">SteamID64</span>
                                    <span class="font-mono text-xs text-slate-300">{{ item.steam_id_64 || 'N/A' }}</span>
                                </div>
                                <button @click="copyToClipboard(item.steam_id_64)" class="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition-colors">
                                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </button>
                            </div>

                            <!-- Additional IDs -->
                             <div class="grid grid-cols-2 gap-2">
                                <div class="bg-slate-950/30 rounded-lg p-2 border border-slate-800/50">
                                    <span class="block text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">ID2</span>
                                    <span class="font-mono text-[10px] text-slate-400 break-all select-all">{{ item.steam_id || '-' }}</span>
                                </div>
                                 <div class="bg-slate-950/30 rounded-lg p-2 border border-slate-800/50">
                                    <span class="block text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">ID3</span>
                                    <span class="font-mono text-[10px] text-slate-400 break-all select-all">{{ item.steam_id_3 || '-' }}</span>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>

                <!-- Pagination -->
                 <div v-if="filteredList.length > pageSize" class="flex flex-col sm:flex-row items-center justify-between border-t border-slate-800/60 pt-6 gap-4">
                    <p class="text-sm text-slate-500 order-2 sm:order-1">
                        显示 <span class="text-slate-300 font-medium">{{ startIndex + 1 }}</span> - <span class="text-slate-300 font-medium">{{ Math.min(endIndex, filteredList.length) }}</span> 条，
                        共 <span class="text-slate-300 font-medium">{{ filteredList.length }}</span> 条
                    </p>
                    
                    <nav class="isolate inline-flex rounded-xl shadow-sm order-1 sm:order-2" aria-label="Pagination">
                         <button 
                            @click="currentPage--"
                            :disabled="currentPage === 1"
                            class="relative inline-flex items-center rounded-l-xl px-3 py-2 bg-slate-900 border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" /></svg>
                        </button>
                        
                        <button
                            v-for="p in visiblePages"
                            :key="p"
                            @click="currentPage = p"
                            :class="[
                                currentPage === p 
                                    ? 'z-10 bg-indigo-600 text-white border-indigo-500 shadow-[0_0_10px_-2px_rgba(99,102,241,0.5)]' 
                                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-white',
                                'relative inline-flex items-center px-4 py-2 text-sm font-semibold border-y border-r first:border-l transition-all'
                            ]"
                        >
                            {{ p }}
                        </button>
                        
                        <button 
                            @click="currentPage++"
                            :disabled="currentPage >= totalPages"
                            class="relative inline-flex items-center rounded-r-xl px-3 py-2 bg-slate-900 border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" /></svg>
                        </button>
                    </nav>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import api from '@/utils/api'; // Use configured API instance

const list = ref([]);
const loading = ref(true);
const searchQuery = ref('');
const currentTab = ref('all');
const currentPage = ref(1);
const pageSize = 15;

const tabs = [
    { label: '全部', value: 'all' },
    { label: '已通过', value: 'approved' },
    { label: '审核中', value: 'pending' },
    { label: '已拒绝', value: 'rejected' },
];

const fetchList = async () => {
    loading.value = true;
    try {
        // Use api instance which handles baseURL ("/api") automatically.
        // The backend route is /api/whitelist/public-list.
        // Since baseURL is /api, we should request /whitelist/public-list
        const response = await api.get('/whitelist/public-list');
        
        if (Array.isArray(response.data)) {
            list.value = response.data;
        } else {
            console.error('Invalid response format:', response.data);
            list.value = []; // Fallback to empty array
        }
    } catch (error) {
        console.error('Failed to fetch whitelist:', error);
        list.value = [];
    } finally {
        loading.value = false;
    }
};

const clearFilters = () => {
    searchQuery.value = '';
    currentTab.value = 'all';
};

// --- Filters & Search ---
const filteredList = computed(() => {
    let result = list.value;

    // Tab Filter
    if (currentTab.value !== 'all') {
        result = result.filter(item => item.status === currentTab.value);
    }

    // Search Filter
    if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase();
        result = result.filter(item => 
            item.name.toLowerCase().includes(q) || 
            (item.steam_id && item.steam_id.includes(q)) ||
            (item.steam_id_64 && item.steam_id_64.includes(q)) ||
            (item.steam_id_3 && item.steam_id_3.includes(q))
        );
    }

    return result;
});

// --- Pagination ---
const totalPages = computed(() => Math.ceil(filteredList.value.length / pageSize));

// Reset page on filter change
watch([currentTab, searchQuery], () => {
    currentPage.value = 1;
});

const startIndex = computed(() => (currentPage.value - 1) * pageSize);
const endIndex = computed(() => startIndex.value + pageSize);
const paginatedList = computed(() => filteredList.value.slice(startIndex.value, endIndex.value));

const visiblePages = computed(() => {
    const pages = [];
    const total = totalPages.value;
    const current = currentPage.value;
    const maxVisible = 5;

    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
        pages.push(i);
    }
    return pages;
});

// --- Utilities ---
const getCount = (status) => {
    if (status === 'all') return list.value.length;
    return list.value.filter(item => item.status === status).length;
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getStatusText = (status) => {
    const map = {
        'approved': '已通过',
        'pending': '审核中',
        'rejected': '已拒绝'
    };
    return map[status] || status;
};

const getStatusBadgeClass = (status) => {
    const map = {
        'approved': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10',
        'pending': 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/10',
        'rejected': 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/10'
    };
    return map[status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';
};

const getStatusBorderClass = (status) => {
    const map = {
        'approved': 'bg-emerald-500 shadow-[0_0_10px_theme(colors.emerald.500)]',
        'pending': 'bg-amber-500 shadow-[0_0_10px_theme(colors.amber.500)]',
        'rejected': 'bg-rose-500 shadow-[0_0_10px_theme(colors.rose.500)]'
    };
    return map[status] || 'bg-slate-500';
};

const copyToClipboard = async (text) => {
    if (!text) return;
    try {
        await navigator.clipboard.writeText(text);
        // Visual feedback could be added here if needed
    } catch (err) {
        console.error('Failed to copy', err);
    }
};

onMounted(() => {
    fetchList();
});
</script>

<style scoped>
/* Custom scrollbar for tab container */
.no-scrollbar::-webkit-scrollbar {
    display: none;
}
.no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>
