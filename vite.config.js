import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Приложение ходит на свой домен (/api/...), Vite пересылает запрос на API.
      // Это обходит CORS: для браузера запрос same-origin, а API ничего не знает о CORS.
      '/api': {
        target: 'http://api.favorit-parts.ru',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/hs/hsprice'),
      },
    },
  },
})
