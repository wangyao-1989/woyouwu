import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ['chrome >= 80', 'edge >= 80', 'firefox >= 80', 'safari >= 14'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
      renderLegacyChunks: false,
      modernPolyfills: true,
    }),
  ],
  build: {
    target: ['es2021', 'chrome80'],
    cssTarget: ['chrome80'],
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
  },
  test: {
    environment: 'jsdom',
    globals: true,
  }
})
