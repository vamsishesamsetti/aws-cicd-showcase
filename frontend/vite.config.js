import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/auth': { target: process.env.API_URL || 'http://localhost:3000', changeOrigin: true },
      '/tasks': { target: process.env.API_URL || 'http://localhost:3000', changeOrigin: true },
    },
  },
})
