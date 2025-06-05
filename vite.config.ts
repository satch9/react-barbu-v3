import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/socket.io': {
        target: 'http://localhost:4003',
        ws: true,
        changeOrigin: true,
        secure: false
      },
    },
    host: '0.0.0.0',
    port: 5173,
    hmr: {
      host: process.env.HOSTNAME,
      protocol: 'wss',
      clientPort: 443
    }
  }
})