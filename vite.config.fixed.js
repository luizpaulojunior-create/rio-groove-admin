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
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'framer-motion': ['framer-motion'],
          'react-hook-form': ['react-hook-form'],
          'lucide-react': ['lucide-react'],
          'supabase': ['@supabase/supabase-js'],
          'axios': ['axios']
        }
      }
    }
  }
})