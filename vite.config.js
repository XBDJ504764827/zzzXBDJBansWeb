import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0', // Expose to network
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, '') // We kept /api prefix in backend router, so no rewrite needed if backend expects /api
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
