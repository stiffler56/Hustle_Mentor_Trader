import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    proxy: {
      '/api-metaapi-provisioning': {
        target: 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-metaapi-provisioning/, ''),
        secure: false,
      },
      '/api-metaapi-client': {
        target: 'https://mt-client-api-v1.london.agiliumtrade.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-metaapi-client/, ''),
        secure: false,
      },
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
