/// <reference types="@capawesome/capacitor-badge" />

import type { CapacitorConfig } from '@capacitor/cli'

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
    url: 'https://web--my-flixer--realashleybailey-coder.gitcloud.org',
    allowNavigation: ['*.gitcloud.org', '*.stripe.com', '*.stripe.network', '*.squarecdn.com', '*.squareup.com', '*.squareupsandbox.com'],
    iosScheme: 'https',
    androidScheme: 'https',
  },
}

export default config
