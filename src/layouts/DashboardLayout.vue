<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const sidebarOpen = ref(true)

const navigation = [
  { name: '社区组管理', href: '/admin/community', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { name: '封禁管理', href: '/admin/bans', icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' },
  { name: '禁言管理', href: '/admin/mutes', icon: 'M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z' }, // Simplified icon
]

const currentRoute = computed(() => route.path)
</script>

<template>
  <div class="min-h-screen bg-slate-950 flex font-sans text-slate-200">
    <!-- Sidebar -->
    <aside 
      class="fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-300 ease-in-out transform lg:translate-x-0 lg:static lg:inset-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <!-- Logo -->
      <div class="h-16 flex items-center justify-center border-b border-slate-800 bg-slate-900/50">
        <h1 class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
          zzzXBDJBans
        </h1>
      </div>

      <!-- Nav -->
      <nav class="p-4 space-y-2 mt-4">
        <router-link 
          v-for="item in navigation" 
          :key="item.name"
          :to="item.href"
          class="flex items-center px-4 py-3 rounded-lg transition-all duration-200 group"
          :class="[
            currentRoute.startsWith(item.href) 
              ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' 
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          ]"
        >
          <svg 
            class="mr-3 h-5 w-5 transition-colors group-hover:text-blue-400"
            :class="currentRoute.startsWith(item.href) ? 'text-blue-400' : 'text-slate-500'"
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
          </svg>
          <span class="font-medium">{{ item.name }}</span>
        </router-link>
      </nav>

      <!-- User Info Footer -->
      <div class="absolute bottom-0 w-full p-4 border-t border-slate-800 bg-slate-900/50">
        <div class="flex items-center gap-3">
          <div class="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
            AD
          </div>
          <div>
            <p class="text-sm font-medium text-white">Admin</p>
            <p class="text-xs text-slate-500">Super Administrator</p>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Top Header (Mobile Toggle & Breadcrumbs/Titles) -->
      <header class="h-16 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between px-6 backdrop-blur-sm lg:hidden">
        <button @click="sidebarOpen = !sidebarOpen" class="text-slate-400 hover:text-white">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span class="text-lg font-bold text-white">Dashboard</span>
        <div class="w-6"></div> <!-- Spacer for center alignment visuals -->
      </header>

      <!-- Content -->
      <main class="flex-1 overflow-y-auto bg-slate-950 p-6 lg:p-8">
        <div class="max-w-7xl mx-auto">
          <router-view v-slot="{ Component }">
            <transition 
              enter-active-class="transition ease-out duration-200"
              enter-from-class="opacity-0 translate-y-2"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition ease-in duration-150"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 translate-y-2"
              mode="out-in"
            >
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </main>
    </div>

    <!-- Mobile Overlay -->
    <div 
      v-if="sidebarOpen" 
      class="fixed inset-0 bg-black/50 z-40 lg:hidden glass-overlay"
      @click="sidebarOpen = false"
    ></div>
  </div>
</template>

<style scoped>
.glass-overlay {
  backdrop-filter: blur(2px);
}
</style>
