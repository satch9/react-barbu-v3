import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/socket.io': {
        target: `http://${process.env.HOSTNAME || 'localhost'}:4003`,
        ws: true,
        changeOrigin: true,
        secure: false
      },
    },
    host: true,
    hmr: {
      clientPort: 443
    }
  }
})