import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import vue from '@vitejs/plugin-vue'
import { existsSync, readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const certPath = 'certs/origin.pem'
const keyPath = 'certs/origin.key'
const hasOriginCert = existsSync(certPath) && existsSync(keyPath)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    ...(hasOriginCert ? [] : [basicSsl()]),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon-48.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Flixer',
        short_name: 'Flixer',
        description: 'Your personal streaming experience.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#080811',
        theme_color: '#080811',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,woff2}', 'favicon.svg', 'icons.svg'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        importScripts: ['push-sw.js'],
        runtimeCaching: [
          {
            // Country flags (hashed filenames) are cached on first view instead of bloating the install.
            urlPattern: ({ url }) => url.pathname.startsWith('/assets/') && url.pathname.endsWith('.svg'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'flixer-flags',
              expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // Profile pictures have unique, immutable filenames.
            urlPattern: ({ url }) => url.pathname.startsWith('/api/auth/avatars/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'flixer-avatars',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // Never cache authenticated API data.
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  // Preview serves on the dev port too; host, https and the proxy are inherited from `server`.
  preview: {
    port: 5173,
    strictPort: true,
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    ...(hasOriginCert ? { https: { cert: readFileSync(certPath), key: readFileSync(keyPath) } } : {}),
    proxy: {
      '/api': {
        target: 'http://localhost:8083',
        changeOrigin: true,
        ws: true,
      },
      '/stream': {
        target: 'http://localhost:8091',
        changeOrigin: true,
      },
      '/info': {
        target: 'http://localhost:8091',
        changeOrigin: true,
      },
      '/hls': {
        target: 'http://localhost:8091',
        changeOrigin: true,
      },
      '/lyrics': {
        target: 'http://localhost:8091',
        changeOrigin: true,
      },
      '/subtitles': {
        target: 'http://localhost:8091',
        changeOrigin: true,
      },
      '/trickplay': {
        target: 'http://localhost:8091',
        changeOrigin: true,
      },
    },
  },
})
