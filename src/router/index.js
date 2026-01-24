import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'

const routes = [
    {
        path: '/',
        name: 'Login',
        component: LoginView
    },
    // Placeholder for dashboard
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('../App.vue'), // Temporary placeholder
        beforeEnter: (to, from, next) => {
            // Mock auth guard
            next()
        }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
