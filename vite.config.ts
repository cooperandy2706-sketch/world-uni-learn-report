import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Read version from package.json at build time
const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.BUILD_TARGET === 'electron' ? './' : '/',
  define: {
    // Injected as a global constant — accessible as __APP_VERSION__ in all source files
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    rollupOptions: {
      external: ['bail'],
    },
  },
})
