<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../composables/useAuthStore'
import { useTheme } from '../composables/useTheme'

const router = useRouter()
const route = useRoute()
const { currentUser, isSystemAdmin, logout } = useAuthStore()
const { isDark, toggleTheme } = useTheme()

const handleLogout = async () => {
  await logout()
  router.push('/')
}

const sidebarOpen = ref(true)

const navigation = [
  { name: '社区组管理', href: '/admin/community', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { name: '封禁管理', href: '/admin/bans', icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' },
  { name: '管理员管理', href: '/admin/admins', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { name: '操作日志', href: '/admin/logs', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', requiresSuperAdmin: true },
  { name: '进服列表', href: '/admin/verifications', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', requiresSuperAdmin: true },
  { name: '白名单管理', href: '/admin/whitelist', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
]

const quickLinks = [
  { name: '白名单申请', href: '/apply', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { name: '封禁公示', href: '/bans', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  { name: '白名单公示', href: '/whitelist-status', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
]

import ChangePasswordModal from '../components/ChangePasswordModal.vue'

const currentRoute = computed(() => route.path)
const showPasswordModal = ref(false)
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-200 transition-colors duration-300">
    <!-- Change Password Modal -->
    <ChangePasswordModal :isOpen="showPasswordModal" @close="showPasswordModal = false" />
    <!-- Sidebar -->
    <aside 
      class="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 transition-all duration-300 ease-in-out transform lg:translate-x-0 lg:static lg:inset-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <!-- Logo -->
      <div class="h-16 flex items-center justify-center border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
        <h1 class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300">
          zzzXBDJBans
        </h1>
      </div>

      <!-- Nav -->
      <nav class="p-4 space-y-2 mt-4">
        <template v-for="item in navigation" :key="item.name">
          <router-link 
            v-if="!item.requiresSuperAdmin || isSystemAdmin"
            :to="item.href"
            class="flex items-center px-4 py-3 rounded-lg transition-all duration-200 group"
            :class="[
              currentRoute.startsWith(item.href) 
                ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-600/20' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            ]"
          >
            <svg 
              class="mr-3 h-5 w-5 transition-colors group-hover:text-blue-500 dark:group-hover:text-blue-400"
              :class="currentRoute.startsWith(item.href) ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
            </svg>
            <span class="font-medium">{{ item.name }}</span>
          </router-link>
        </template>
      </nav>

      <!-- Quick Links -->
      <div class="px-6 mt-6 mb-2">
        <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">快速跳转</h3>
      </div>
      <nav class="px-4 space-y-2">
        <router-link 
          v-for="item in quickLinks" 
          :key="item.name"
          :to="item.href"
          target="_blank"
          class="flex items-center px-4 py-2 text-sm rounded-lg transition-colors duration-200 text-slate-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white group"
        >
          <svg 
            class="mr-3 h-4 w-4 text-slate-500 group-hover:text-white transition-colors"
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
          </svg>
          {{ item.name }}
          <!-- External Link Icon -->
          <svg class="ml-auto h-3 w-3 opacity-0 group-hover:opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </router-link>
      </nav>

      <!-- User Info Footer -->
      <div class="absolute bottom-0 w-full p-4 border-t border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
        <div class="flex items-center justify-between gap-3" v-if="currentUser">
          <div class="flex items-center gap-3 overflow-hidden">
             <div class="h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-sm"
                  :class="isSystemAdmin ? 'bg-purple-600' : 'bg-blue-600'">
               {{ currentUser.username.substring(0, 2).toUpperCase() }}
             </div>
             <div class="min-w-0">
               <p class="text-sm font-medium text-slate-700 dark:text-white truncate">{{ currentUser.username }}</p>
               <p class="text-xs text-slate-500 truncate">{{ isSystemAdmin ? 'System Admin' : 'Admin' }}</p>
             </div>
          </div>
          <button 
            @click="showPasswordModal = true"
            class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
            title="修改密码"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 000-2z" clip-rule="evenodd" />
            </svg>
          </button>
          <button 
            @click="handleLogout"
            class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
            title="退出登录"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
        <div class="flex items-center gap-3" v-else>
             <p class="text-xs text-slate-500">Not Logged In</p>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Top Header (Mobile Toggle & Breadcrumbs/Titles) -->
      <header class="h-16 bg-white/50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-6 backdrop-blur-sm lg:hidden">
        <button @click="sidebarOpen = !sidebarOpen" class="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span class="text-lg font-bold text-slate-800 dark:text-white">Dashboard</span>
        <div class="w-6"></div> <!-- Spacer for center alignment visuals -->
      </header>

      <!-- Content -->
      <main class="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-950 p-6 lg:p-8 relative">
        <!-- Theme Toggle (Floating) -->
        <div class="absolute top-6 right-6 z-10">
          <button 
            @click="toggleTheme" 
            class="p-2 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
            :title="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
          >
            <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>
        </div>

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
