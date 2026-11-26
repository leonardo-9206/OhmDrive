import { realpathSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  root: realpathSync(process.cwd()),
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'kilo-icon.svg'],
      manifest: {
        name: 'OhmDrive — Circuitos Eléctricos CD',
        short_name: 'OhmDrive',
        description:
          'Aprendizaje interactivo de Circuitos Eléctricos en Corriente Directa con motor SVG y Kilo (K-1L0).',
        theme_color: '#090D16',
        background_color: '#090D16',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        lang: 'es-MX',
        icons: [
          {
            src: '/kilo-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
          {
            src: '/favicon.svg',
            sizes: '64x64',
            type: 'image/svg+xml',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2,ttf,json}'],
        navigateFallback: '/index.html',
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-motion': ['framer-motion', 'lucide-react'],
          'vendor-katex': ['katex'],
          'vendor-supabase': ['@supabase/supabase-js', 'zustand'],
        },
      },
    },
  },
})
