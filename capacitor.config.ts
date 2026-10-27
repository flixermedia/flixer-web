import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.flixermedia.flixer',
  appName: 'Flixer',
  webDir: 'dist',
  iosScheme: 'https',
  androidScheme: 'https',
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 3000,
      launchFadeOutDuration: 200,
      backgroundColor: '#080811',
      androidScaleType: 'CENTER_CROP',
    },
  },
  server: {
    url: 'https://web--my-flixer--realashleybailey-coder.gitcloud.org',
    allowNavigation: ['*.gitcloud.org'],
    iosScheme: 'https',
    androidScheme: 'https',
  },
}

export default config
