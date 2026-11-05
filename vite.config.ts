import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => ({
  server: {
    proxy: {
      '/api/v1/admin/': {
        target: loadEnv(mode, process.cwd(), 'FOCUSTIME_').FOCUSTIME_API_TARGET || 'http://127.0.0.1:5080',
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rollupOptions: { output: { manualChunks: { charts: ['recharts'] } } },
  },
}))
