import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 백엔드(server/)로 /api 요청을 넘김 (쿠키가 같은 주소로 가도록)
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
