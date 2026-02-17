import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

const loadConfig = async () => {
    try {
        const response = await fetch('/config.json');
        const config = await response.json();
        window.runtimeConfig = config;
    } catch (error) {
        console.error('Failed to load config, using defaults', error);
        window.runtimeConfig = {
            apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api'
        };
    }
};

loadConfig().then(() => {
    createApp(App)
        .use(router)
        .mount('#app')
});
