import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/socket.io': {
        target: 'http://localhost:4003',
        ws: true,
      },
      '/api':{
        target:'http://localhost:4003',
        changeOrigin: true,
      }
    },
    host: '0.0.0.0',
    port: 5173,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173
    }
  }
})