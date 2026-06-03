import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ['chrome >= 64', 'edge >= 79', 'firefox >= 67', 'safari >= 12'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
      renderLegacyChunks: true,
      modernPolyfills: true,
    }),
  ],
  build: {
    target: ['es2015', 'chrome64'],
    cssTarget: ['chrome64'],
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5004',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:5004',
        changeOrigin: true
      }
    }
  }
})
