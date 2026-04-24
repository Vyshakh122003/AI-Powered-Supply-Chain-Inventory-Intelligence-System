import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(() => {
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
          target: 'http://localhost:5678', // Bypass ngrok locally to prevent 405 block
          changeOrigin: true,
          secure: false,
        },
        '/api/v1': {
          target: 'http://localhost:5678', // Bypass ngrok locally to prevent 405 block
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
