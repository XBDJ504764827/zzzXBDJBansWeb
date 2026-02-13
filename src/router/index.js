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
            path: '/apply',
            name: 'apply',
            component: () => import('../views/WhitelistApply.vue'),
        },
        {
            path: '/whitelist-status',
            name: 'whitelist-status',
            component: () => import('../views/WhitelistStatus.vue'),
        },
        {
            path: '/bans',
            name: 'public-bans',
            component: () => import('../views/PublicBanList.vue'),
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
                    component: () => import('../views/admin/AuditLog.vue'),
                    meta: { requiresSuperAdmin: true }
                },
                {
                    path: 'whitelist',
                    name: 'whitelist',
                    component: () => import('../views/admin/WhitelistManagement.vue')
                },
                {
                    path: 'verifications',
                    name: 'verifications',
                    component: () => import('../views/admin/VerificationList.vue'),
                    meta: { requiresSuperAdmin: true }
                },
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
    const userStr = localStorage.getItem('user')
    const user = userStr ? JSON.parse(userStr) : null
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
    const requiresSuperAdmin = to.matched.some(record => record.meta.requiresSuperAdmin)

    // 1. Protected Route Check
    if (requiresAuth && !token) {
        next('/')
    }
    // 2. Super Admin Check
    else if (requiresSuperAdmin && user && user.role !== 'super_admin') {
        // Redirect to default admin dashboard or show a toast/notification (not implemented here)
        // Best to redirect to a safe admin page
        next('/admin/community')
    }
    // 3. Login Page Check (Redirect if already logged in)
    else if (to.path === '/' && token) {
        next('/admin')
    }
    else {
        next()
    }
})

export default router
