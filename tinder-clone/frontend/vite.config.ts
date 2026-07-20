import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    react(),
    legacy({
      // Support any browser that has at least ES5 — covers all modern phones
      targets: ['defaults', 'not IE 11'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
    }),
  ],
  server: {
    port: 5173,
    host: true,  // listen on 0.0.0.0 — makes the app reachable on LAN (phone access)
  },
  build: {
    target: 'es2015',
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2015',
    },
  },
})


