import axios from 'axios'

const api = axios.create({
    baseURL: (window.runtimeConfig && window.runtimeConfig.apiBaseUrl) || import.meta.env.VITE_API_BASE_URL || '/api',
    // fallback to env var or relative path if runtime config fails
    headers: {
        'Content-Type': 'application/json'
    }
})

// Request interceptor to add token
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Response interceptor to handle auth errors
api.interceptors.response.use(response => {
    return response
}, error => {
    if (error.response && error.response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/' // Redirect to login
    }
    return Promise.reject(error)
})

export default api
