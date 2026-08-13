import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: true },
  build: {
    outDir: 'dist',
    // Firebase dwarfs everything else in this app. Splitting it out means an
    // app-code deploy doesn't invalidate it in browser caches — which matters
    // on a phone, and against Hosting's 10GB/month transfer allowance.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          // Firestore is ~three quarters of the SDK on its own, and its
          // webchannel transport is pulled in by nothing else. Kept apart from
          // Auth so the two fetch in parallel and version independently.
          if (id.includes('firebase/firestore')) return 'firebase-firestore'
          if (id.includes('webchannel-wrapper')) return 'firebase-firestore'
          if (id.includes('firebase')) return 'firebase-auth'
          if (id.includes('framer-motion') || id.includes('motion-')) return 'motion'
          if (id.includes('@dnd-kit')) return 'dnd'
        },
      },
    },
  },
})
