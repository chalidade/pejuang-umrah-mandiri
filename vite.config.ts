import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // GitHub Pages memakai sub-path; build native (Capacitor) tetap '/'
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-v2.svg', 'icons/apple-touch-icon-v2.png'],
      manifest: {
        name: 'Pejuang Umrah Mandiri',
        short_name: 'Pejuang Umrah',
        description: 'Teman perjalanan umroh mandiri: persiapan, biaya, dan panduan ibadah yang bisa dipakai offline.',
        lang: 'id',
        theme_color: '#FFFFFF',
        background_color: '#FFFFFF',
        display: 'fullscreen',
        display_override: ['fullscreen', 'standalone'],
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icons/icon-192-v2.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512-v2.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable-v2.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // foto unggahan (/media) dan gambar pratinjau video disimpan setelah pertama dilihat, supaya tetap tampil offline
        globIgnores: ['media/**'],
        runtimeCaching: [
          {
            urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/media/'),
            handler: 'CacheFirst',
            options: { cacheName: 'pum-media', expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 180 } },
          },
          {
            urlPattern: ({ url }) => url.hostname === 'i.ytimg.com',
            handler: 'CacheFirst',
            options: { cacheName: 'pum-thumb', expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 60 }, cacheableResponse: { statuses: [0, 200] } },
          },
          {
            urlPattern: ({ request, sameOrigin }) => !sameOrigin && request.destination === 'image',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'pum-foto-luar', expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 60 }, cacheableResponse: { statuses: [0, 200] } },
          },
        ],
      },
    }),
  ],
})
