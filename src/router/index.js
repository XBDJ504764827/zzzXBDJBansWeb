import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'login',
            component: LoginView,
        },
        {
            path: '/admin',
            component: DashboardLayout,
            children: [
                {
                    path: '',
                    redirect: '/admin/community'
                },
                {
                    path: 'community',
                    name: 'community',
                    // Lazy load the view
                    component: () => import('../views/admin/CommunityManagement.vue')
                },
                {
                    path: 'bans',
                    name: 'bans',
                    component: () => import('../views/admin/BanList.vue')
                },
                {
                    path: 'mutes',
                    name: 'mutes',
                    component: { template: '<div class="text-white p-4">Mute Management (Coming Soon)</div>' }
                }
            ]
        }
    ],
})

export default router
