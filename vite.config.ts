import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.BUILD_TARGET === 'electron' ? './' : '/',
  build: {
    rollupOptions: {
      external: ['bail'],
    },
  },
})
