import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-react')) return 'lucide-react';
            if (id.includes('framer-motion')) return 'framer-motion';
            if (id.includes('react-hook-form')) return 'react-hook-form';
            if (id.includes('@supabase')) return 'supabase';
            return 'vendor';
          }
          if (id.includes('src/pages/Shipping') || id.includes('src/services/shipping')) {
            return 'melhor-envio';
          }
          if (id.includes('src/pages/Stats') || id.includes('src/services/analytics')) {
            return 'charts';
          }
        }
      }
    }
  }
})
