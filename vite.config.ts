import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
<<<<<<< Updated upstream
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
=======
      '/api': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
>>>>>>> Stashed changes
    },
  },
})

