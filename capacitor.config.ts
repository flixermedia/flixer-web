/// <reference types="@capawesome/capacitor-badge" />

import type { CapacitorConfig } from '@capacitor/cli'

const liveUrl = process.env.CAPACITOR_LIVE_URL?.trim()

const config: CapacitorConfig = {
  appId: 'com.flixermedia.flixer',
  appName: 'Flixer',
  webDir: 'dist',
  plugins: {
    TextInteraction: {
      enabled: true,
    },
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 3000,
      launchFadeOutDuration: 200,
      backgroundColor: '#080811',
      androidScaleType: 'CENTER_CROP',
    },
    LocalNotifications: {
      presentationOptions: ['badge', 'sound', 'banner', 'list'],
    },
    Badge: {
      persist: true,
      autoClear: false,
    },
  },
  server: {
    ...(liveUrl ? { url: liveUrl } : {}),
    allowNavigation: ['*.gitcloud.org', '*.stripe.com', '*.stripe.network', '*.squarecdn.com', '*.squareup.com', '*.squareupsandbox.com'],
    iosScheme: 'https',
    androidScheme: 'https',
  },
}

export default config
