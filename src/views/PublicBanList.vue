<template>
    <div class="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200 font-sans selection:bg-rose-500/30">
        <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8">
            <!-- Header -->
            <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800/60 pb-8">
                <div>
                    <h2 class="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-400 tracking-tight">
                        封禁公示
                    </h2>
                    <p class="mt-2 text-slate-400 text-lg">
                        服务器违规与封禁记录公示
                        <span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                            共 {{ list.length }} 条记录
                        </span>
                    </p>
                </div>
                <div>
                     <router-link to="/" class="group inline-flex items-center px-5 py-2.5 border border-slate-700 rounded-xl shadow-sm text-sm font-semibold text-slate-300 bg-slate-800/50 hover:bg-slate-800 hover:text-white hover:border-slate-600 transition-all duration-300">
                        <svg class="mr-2 -ml-1 h-5 w-5 text-slate-500 group-hover:text-slate-300 transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        返回首页
                     </router-link>
                </div>
            </div>

            <!-- Controls (Search) -->
            <div class="sticky top-4 z-20">
                <div class="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <!-- Status Filter (Active/Expired) -->
                    <div class="flex p-1 space-x-1 bg-slate-950/50 rounded-xl border border-slate-800/50">
                        <button 
                            @click="currentTab = 'all'"
                            :class="[
                                'px-4 py-2 text-sm font-medium rounded-lg transition-all',
                                currentTab === 'all' ? 'bg-slate-800 text-white shadow-sm ring-1 ring-white/10' : 'text-slate-400 hover:text-slate-200'
                            ]"
                        >
                            全部
                        </button>
                        <button 
                            @click="currentTab = 'active'"
                            :class="[
                                'px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2',
                                currentTab === 'active' ? 'bg-rose-900/30 text-rose-400 shadow-sm ring-1 ring-rose-500/20' : 'text-slate-400 hover:text-slate-200'
                            ]"
                        >
                            <span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                            生效中
                        </button>
                    </div>

                    <!-- Search Box -->
                    <div class="relative w-full md:w-96 group">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg class="h-5 w-5 text-slate-500 group-focus-within:text-rose-400 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <input 
                            v-model="searchQuery" 
                            type="text" 
                            class="block w-full pl-10 pr-3 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all shadow-inner" 
                            placeholder="搜索玩家昵称 / SteamID..." 
                        />
                    </div>
                </div>
            </div>

            <!-- Content Area -->
            <div v-if="loading" class="flex flex-col items-center justify-center py-32 space-y-4">
                <div class="relative">
                    <div class="w-12 h-12 border-4 border-slate-800 rounded-full"></div>
                    <div class="w-12 h-12 border-4 border-rose-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                </div>
                <p class="text-slate-500 animate-pulse">正在加载封禁数据...</p>
            </div>

            <div v-else class="space-y-6">
                 <!-- Empty State -->
                <div v-if="filteredList.length === 0" class="flex flex-col items-center justify-center py-24 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
                    <div class="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                        <svg class="h-8 w-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                    </div>
                    <h3 class="text-lg font-medium text-slate-300">无封禁记录</h3>
                    <p class="mt-1 text-slate-500">暂时没有符合条件的封禁记录</p>
                </div>

                <!-- Desktop Table View -->
                <div v-if="filteredList.length > 0" class="hidden md:block rounded-2xl border border-slate-800 overflow-hidden shadow-2xl bg-slate-900/40 backdrop-blur-sm">
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-slate-800/50">
                            <thead class="bg-slate-950/50">
                                <tr>
                                    <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">状态</th>
                                    <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">玩家信息</th>
                                    <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">封禁原因</th>
                                    <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">时长 / 过期时间</th>
                                    <th scope="col" class="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">执行时间</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-800/50 bg-slate-900/20">
                                <tr v-for="item in paginatedList" :key="item.id" class="hover:bg-rose-500/5 transition-colors group">
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span :class="getStatusBadgeClass(item.status)" class="px-3 py-1 rounded-full text-xs font-medium border shadow-sm">
                                            {{ item.status === 'active' ? '生效中' : '已过期/解封' }}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="flex flex-col">
                                            <div class="flex items-center gap-2">
                                                <div class="text-sm font-bold text-white group-hover:text-rose-300 transition-colors">{{ item.name }}</div>
                                                <a 
                                                    v-if="item.steam_id_64"
                                                    :href="`https://steamcommunity.com/profiles/${item.steam_id_64}`" 
                                                    target="_blank"
                                                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-[10px] text-indigo-400 font-medium hover:bg-indigo-500/20 hover:text-indigo-300 transition-all"
                                                    title="访问 Steam 个人主页"
                                                >
                                                    <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0C5.372 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.65 0-5.789 2.737-5.789 5.57 0 1.103.425 2.286.956 2.922.105.126.12.235.089.425-.098.406-.316 1.285-.359 1.465-.057.24-.19.29-.439.175-1.638-.762-2.661-3.155-2.661-5.069 0-4.128 3.003-7.915 8.657-7.915 4.545 0 8.077 3.242 8.077 7.575 0 4.521-2.85 8.164-6.808 8.164-1.33 0-2.58-.691-3.011-1.506l-.823 3.136c-.297 1.135-1.103 2.555-1.642 3.422C13.253 23.834 14.61 24 16 24c6.627 0 12-5.372 12-12S22.627 0 16 0h-4z" opacity="0"/></svg>
                                                    <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                    Steam 主页
                                                </a>
                                            </div>
                                            
                                            <div class="flex flex-col gap-1 mt-1.5">
                                                <!-- ID64 -->
                                                <div v-if="item.steam_id_64" class="flex items-center gap-2 group/id">
                                                    <span class="text-[10px] text-slate-500 uppercase tracking-wider w-8">ID64</span>
                                                    <span class="font-mono text-xs text-slate-400 select-all group-hover/id:text-slate-200 transition-colors">{{ item.steam_id_64 }}</span>
                                                    <button @click="copyToClipboard(item.steam_id_64)" class="opacity-0 group-hover/id:opacity-100 text-slate-600 hover:text-indigo-400 transition-all" title="复制">
                                                        <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                <!-- ID2 -->
                                                <div v-if="item.steam_id" class="flex items-center gap-2 group/id">
                                                    <span class="text-[10px] text-slate-500 uppercase tracking-wider w-8">ID2</span>
                                                    <span class="font-mono text-xs text-slate-500 select-all group-hover/id:text-slate-400 transition-colors">{{ item.steam_id }}</span>
                                                </div>
                                                <!-- ID3 -->
                                                <div v-if="item.steam_id_3" class="flex items-center gap-2 group/id">
                                                    <span class="text-[10px] text-slate-500 uppercase tracking-wider w-8">ID3</span>
                                                    <span class="font-mono text-xs text-slate-500 select-all group-hover/id:text-slate-400 transition-colors">{{ item.steam_id_3 }}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="text-sm text-slate-300 max-w-xs truncate" :title="item.reason">{{ item.reason || '无原因' }}</div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="flex flex-col">
                                            <span class="text-sm text-white font-medium">
                                                {{ formatDuration(item.duration) }}
                                            </span>
                                            <span v-if="item.expires_at" class="text-xs text-slate-500">
                                                至 {{ formatDate(item.expires_at) }}
                                            </span>
                                            <span v-else class="text-xs text-rose-400/80">永久有效</span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-right">
                                        <div class="text-xs text-slate-500">{{ formatDate(item.created_at) }}</div>
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
                        <div class="absolute left-0 top-0 bottom-0 w-1" :class="item.status === 'active' ? 'bg-rose-500' : 'bg-slate-600'"></div>
                        
                        <div class="flex justify-between items-start mb-3 pl-3">
                             <div>
                                <div class="flex items-center gap-2">
                                    <h3 class="text-lg font-bold text-slate-100 group-hover:text-rose-400 transition-colors">{{ item.name }}</h3>
                                    <a 
                                        v-if="item.steam_id_64"
                                        :href="`https://steamcommunity.com/profiles/${item.steam_id_64}`" 
                                        target="_blank"
                                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-[10px] text-indigo-400 font-medium hover:bg-indigo-500/20 hover:text-indigo-300 transition-all"
                                    >
                                        <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        Steam 主页
                                    </a>
                                </div>
                                <div class="flex flex-col gap-0.5 mt-2">
                                    <span v-if="item.steam_id_64" class="font-mono text-xs text-slate-400">ID64: {{ item.steam_id_64 }}</span>
                                    <span v-if="item.steam_id" class="font-mono text-xs text-slate-500">ID2: {{ item.steam_id }}</span>
                                    <span v-if="item.steam_id_3" class="font-mono text-xs text-slate-500">ID3: {{ item.steam_id_3 }}</span>
                                </div>
                             </div>
                             <span :class="getStatusBadgeClass(item.status)" class="px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-sm">
                                {{ item.status === 'active' ? '生效中' : '失效' }}
                            </span>
                        </div>
                        
                        <div class="pl-3 space-y-3 mt-4 border-t border-slate-800/50 pt-3">
                            <div>
                                <span class="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">封禁原因</span>
                                <p class="text-sm text-slate-300">{{ item.reason || '无原因' }}</p>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <span class="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">时长</span>
                                    <span class="text-sm text-white">{{ formatDuration(item.duration) }}</span>
                                </div>
                                <div>
                                    <span class="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">执行时间</span>
                                    <span class="text-sm text-slate-400">{{ formatDateShort(item.created_at) }}</span>
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
                                    ? 'z-10 bg-rose-600 text-white border-rose-500 shadow-[0_0_10px_-2px_rgba(225,29,72,0.5)]' 
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
import { useRouter, useRoute } from 'vue-router';
import api from '@/utils/api'; 

const route = useRoute();
const router = useRouter();

const list = ref([]);
const loading = ref(true);
const searchQuery = ref('');
const currentTab = ref(route.query.tab || 'active'); // Default to showing active bans
const currentPage = ref(1);
const pageSize = 15;

const fetchList = async () => {
    loading.value = true;
    try {
        const response = await api.get('/bans/public');
        if (Array.isArray(response.data)) {
            list.value = response.data;
        } else {
            list.value = [];
        }
    } catch (error) {
        console.error('Failed to fetch public bans:', error);
        list.value = [];
    } finally {
        loading.value = false;
    }
};

// --- Filters & Search ---
const filteredList = computed(() => {
    let result = list.value;

    // Tab Filter
    if (currentTab.value === 'active') {
        result = result.filter(item => item.status === 'active');
    }
    // 'all' includes everything

    // Search Filter
    if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase();
        result = result.filter(item => 
            item.name.toLowerCase().includes(q) || 
            (item.steam_id && item.steam_id.includes(q)) ||
            (item.steam_id_64 && item.steam_id_64.includes(q))
        );
    }

    return result;
});

// --- Pagination ---
const totalPages = computed(() => Math.ceil(filteredList.value.length / pageSize));

watch(currentTab, (newTab) => {
    router.replace({ query: { ...route.query, tab: newTab } });
});

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
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });
};

const formatDateShort = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('zh-CN');
};

const formatDuration = (durationStr) => {
    if (!durationStr || durationStr === '0' || durationStr === '0.0' || durationStr === 'Permanent' || durationStr === 0) return '永久';
    
    const str = String(durationStr).toLowerCase();
    
    // Handle explicit units
    if (str.endsWith('d')) {
        return `${parseFloat(str)} 天`;
    }
    if (str.endsWith('h')) {
        return `${parseFloat(str)} 小时`;
    }
    if (str.endsWith('m')) {
        return `${parseFloat(str)} 分钟`;
    }
    if (str.endsWith('mo')) {
        return `${parseFloat(str)} 个月`;
    }
    if (str.endsWith('y')) {
        return `${parseFloat(str)} 年`;
    }

    // Fallback for plain numbers (assume minutes)
    const minutes = parseInt(durationStr);
    if (isNaN(minutes)) return durationStr;

    if (minutes < 60) return `${minutes} 分钟`;
    if (minutes < 1440) return `${(minutes / 60).toFixed(1)} 小时`;
    return `${(minutes / 1440).toFixed(1)} 天`;
};

const getStatusBadgeClass = (status) => {
    if (status === 'active') {
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/10';
    }
    return 'bg-slate-700/30 text-slate-400 border-slate-600/30';
};

const copyToClipboard = async (text) => {
    if (!text) return;
    try {
        await navigator.clipboard.writeText(text);
    } catch (err) {
        console.error('Failed to copy', err);
    }
};

onMounted(() => {
    fetchList();
});
</script>
