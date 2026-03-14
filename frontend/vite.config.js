import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/webhook': {
          target: env.VITE_N8N_BASE_URL,
          changeOrigin: true,
          secure: false,
          headers: { 'ngrok-skip-browser-warning': 'true' },
        },
        '/api/v1': {
          target: env.VITE_N8N_BASE_URL,
          changeOrigin: true,
          secure: false,
          headers: { 'ngrok-skip-browser-warning': 'true' },
        },
      },
    },
  }
})
