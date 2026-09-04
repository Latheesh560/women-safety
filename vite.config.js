import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('react-router-dom') || id.includes('/react/') || id.includes('/react-dom/')) {
            return 'vendor-react';
          }
          if (id.includes('leaflet') || id.includes('react-leaflet')) {
            return 'vendor-maps';
          }
          if (id.includes('framer-motion') || id.includes('lucide-react')) {
            return 'vendor-ui';
          }
          if (id.includes('socket.io-client')) {
            return 'vendor-realtime';
          }
          return 'vendor-misc';
        },
      },
    },
  },
  server: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5005',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://127.0.0.1:5005',
        ws: true,
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:5005',
        changeOrigin: true,
      }
    }
  }
})
