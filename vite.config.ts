import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import vue from '@vitejs/plugin-vue'
import { existsSync, readFileSync } from 'node:fs'
import { defineConfig, loadEnv, type ProxyOptions } from 'vite'
import { VitePWA, type ManifestOptions } from 'vite-plugin-pwa'
import type { GenerateSWOptions } from 'workbox-build'

const certPath = 'certs/origin.pem'
const keyPath = 'certs/origin.key'
const hasOriginCert = existsSync(certPath) && existsSync(keyPath)

const env = loadEnv('development', process.cwd(), 'VITE_')
const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:8083'
const streamerProxyTarget = env.VITE_STREAMER_PROXY_TARGET || 'http://localhost:8091'

const proxyOptions: Record<string, string | ProxyOptions> = {
  '/api/socket.io': {
    target: apiProxyTarget,
    changeOrigin: true,
    ws: true,
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'))
      proxy.on('proxyReqWs', (proxyReq) => proxyReq.removeHeader('origin'))
    },
  },
  '/api': {
    target: apiProxyTarget,
    changeOrigin: true,
    ws: true,
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'))
      proxy.on('proxyReqWs', (proxyReq) => proxyReq.removeHeader('origin'))
    },
  },
  '/streamer': {
    target: streamerProxyTarget,
    changeOrigin: true,
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'))
    },
  },
}

const manifestOptions: Partial<ManifestOptions> | false = {
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
}

const workboxOptions: Partial<GenerateSWOptions> = {
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
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    ...(hasOriginCert ? [] : [basicSsl()]),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon-48.png', 'apple-touch-icon.png'],
      manifest: manifestOptions,
      workbox: workboxOptions,
    }),
  ],
  // Preview serves on the dev port too; host, https and the proxy are inherited from `server`.
  preview: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    ...(hasOriginCert ? { https: { cert: readFileSync(certPath), key: readFileSync(keyPath) } } : {}),
    proxy: proxyOptions,
  },
  server: {
    host: '0.0.0.0',
    port: 5175,
    allowedHosts: true,
    ...(hasOriginCert ? { https: { cert: readFileSync(certPath), key: readFileSync(keyPath) } } : {}),
    proxy: proxyOptions,
  },
})
