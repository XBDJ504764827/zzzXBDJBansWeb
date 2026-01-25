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
            meta: { requiresAuth: true },
            children: [
                {
                    path: '',
                    redirect: '/admin/community'
                },
                {
                    path: 'community',
                    name: 'community',
                    component: () => import('../views/admin/CommunityManagement.vue')
                },
                {
                    path: 'bans',
                    name: 'bans',
                    component: () => import('../views/admin/BanList.vue')
                },
                {
                    path: 'admins',
                    name: 'admins',
                    component: () => import('../views/admin/AdminList.vue')
                },
                {
                    path: 'logs',
                    name: 'logs',
                    component: () => import('../views/admin/AuditLog.vue')
                },
                {
                    path: 'player-records',
                    name: 'player-records',
                }
            ]
        },
        {
            path: '/:pathMatch(.*)*',
            redirect: '/'
        }
    ],
})

router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token')
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

    // 1. Protected Route Check
    if (requiresAuth && !token) {
        next('/')
    }
    // 2. Login Page Check (Redirect if already logged in)
    else if (to.path === '/' && token) {
        next('/admin')
    }
    else {
        next()
    }
})

export default router
