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
    // Warn on chunks > 800kB (up from default 500kB) — heavy vendor splits
    // are expected and handled explicitly below via manualChunks.
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // Split vendor code into parallel-downloadable, long-cache chunks.
        // Each group is stable across builds so browsers keep them cached.
        manualChunks: (id) => {
          // ── Core React runtime ─────────────────────────────────────────
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/scheduler/')) {
            return 'vendor-react'
          }
          // ── Routing ────────────────────────────────────────────────────
          if (id.includes('node_modules/react-router') ||
              id.includes('node_modules/@remix-run/')) {
            return 'vendor-router'
          }
          // ── Data fetching ──────────────────────────────────────────────
          if (id.includes('node_modules/@tanstack/')) {
            return 'vendor-query'
          }
          // ── Supabase client ────────────────────────────────────────────
          if (id.includes('node_modules/@supabase/')) {
            return 'vendor-supabase'
          }
          // ── State management ───────────────────────────────────────────
          if (id.includes('node_modules/zustand/')) {
            return 'vendor-zustand'
          }
          // ── UI utilities ───────────────────────────────────────────────
          if (id.includes('node_modules/lucide-react/') ||
              id.includes('node_modules/react-hot-toast/')) {
            return 'vendor-ui'
          }
          // ── Form validation ────────────────────────────────────────────
          if (id.includes('node_modules/react-hook-form/') ||
              id.includes('node_modules/zod/') ||
              id.includes('node_modules/@hookform/')) {
            return 'vendor-forms'
          }
          // ── Charts (recharts) ──────────────────────────────────────────
          if (id.includes('node_modules/recharts/') ||
              id.includes('node_modules/d3-') ||
              id.includes('node_modules/victory-')) {
            return 'vendor-charts'
          }
          // ── Virtualized lists ──────────────────────────────────────────
          if (id.includes('node_modules/react-virtuoso/')) {
            return 'vendor-virtuoso'
          }
          // ── Markdown rendering ─────────────────────────────────────────
          if (id.includes('node_modules/react-markdown/') ||
              id.includes('node_modules/remark') ||
              id.includes('node_modules/rehype') ||
              id.includes('node_modules/unified/') ||
              id.includes('node_modules/mdast') ||
              id.includes('node_modules/hast') ||
              id.includes('node_modules/micromark') ||
              id.includes('node_modules/vfile') ||
              id.includes('node_modules/bail/') ||
              id.includes('node_modules/trough/') ||
              id.includes('node_modules/is-plain-obj/')) {
            return 'vendor-markdown'
          }
          // Everything else gets bundled per-page by Vite's default splitting
        },
      },
    },
  },
})

