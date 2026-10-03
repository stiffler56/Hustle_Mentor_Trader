import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
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
