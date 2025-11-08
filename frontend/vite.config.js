// vite.config.js (CORREGIDO)

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// esto en produccion se ignora
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Cualquier petición a /api...
      '/api': {
        target: 'http://localhost:4000', // ...envíala al puerto 4000
        changeOrigin: true, // <-- ESTA LÍNEA ES LA CLAVE
        secure: false,      // (Buena práctica añadir esto)
      },
    },
  },
})