import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  clearScreen: false,
  envPrefix: ['VITE_', 'TAURI_'],

  server: {
    port: 5173,
    strictPort: true,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3002', // URL server backend Anda
        changeOrigin: true,
        secure: false,
        // Opsional: aktifkan baris di bawah ini jika backend Anda tidak menggunakan prefix /api
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
