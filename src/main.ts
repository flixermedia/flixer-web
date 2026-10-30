import { createModal, type DefineGroups } from '@kolirt/vue-modal'
import { App as CapacitorApp } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'
import { SplashScreen } from '@capacitor/splash-screen'
import { addCollection, Icon } from '@iconify/vue'
import lucideIcons from '@iconify-json/lucide/icons.json'
import { createApp } from 'vue'
import { registerSW } from 'virtual:pwa-register'
import Vue3Toastify from 'vue3-toastify'
import { AUTH_INVALID_EVENT } from './api'
import { toastContainerOptions } from './composables/notify'
import { initTheme } from './composables/useTheme'
import { initButtonHaptics } from './platform/haptics'
import { initNativeTextInteraction } from './platform/textInteraction'
import { NATIVE_PASSKEY_CALLBACK_SCHEME } from './platform/passkeyHandoff'
import { i18n, initLocale, syncLocaleFromAccount } from './i18n'
import { initMonitoring } from './monitoring'
import router from './router'
import { restoreNativeAccount } from './platform/nativeAccount'
import { catchError } from './utils/catchError'
import './tailwind.css'
import './toast.css'
import './modal.css'
import App from './App.vue'

declare module '@kolirt/vue-modal' {
  interface ModalGroupRegistry extends DefineGroups<['default']> {}
}

const app = createApp(App)
addCollection(lucideIcons)
app.component('Icon', Icon)
let lastPasskeyCallbackUrl = ''
document.documentElement.classList.toggle('capacitor', Capacitor.isNativePlatform())
initButtonHaptics()
initNativeTextInteraction()
initTheme()

window.addEventListener(AUTH_INVALID_EVENT, () => {
  if (router.currentRoute.value.name !== 'login') {
    void router.replace({ name: 'login' })
  }
})

app.use(i18n)
app.use(router)
app.use(Vue3Toastify, toastContainerOptions)
app.use(createModal({ groups: { default: {} } }))

async function handleAppUrl(url: string) {
  let callback: URL
  try {
    callback = new URL(url)
  } catch {
    return
  }
  if (callback.protocol !== `${NATIVE_PASSKEY_CALLBACK_SCHEME}:` || callback.hostname !== 'passkey' || callback.pathname !== '/callback') return
  if (url === lastPasskeyCallbackUrl) return
  lastPasskeyCallbackUrl = url

  const [closeError] = await catchError(Browser.close())
  if (closeError) {
    console.warn('[passkey] browser close failed after callback', closeError)
  }

  await router.isReady()
  await router.replace({
    name: 'passkey-callback',
    query: {
      code: callback.searchParams.get('code') ?? undefined,
      state: callback.searchParams.get('state') ?? undefined,
      cancelled: callback.searchParams.get('cancelled') ?? undefined,
    },
  })
}

let launchUrl: string | undefined
if (Capacitor.isNativePlatform()) {
  await CapacitorApp.addListener('appUrlOpen', ({ url }) => void handleAppUrl(url))
  launchUrl = (await CapacitorApp.getLaunchUrl())?.url
}

await initLocale()
if (Capacitor.isNativePlatform()) {
  const [restoreError] = await catchError(restoreNativeAccount())
  if (restoreError) {
    console.warn('[native-account] Could not restore the saved account', restoreError)
  }
}
app.mount('#app')
if (Capacitor.isNativePlatform()) {
  await router.isReady()
  if (launchUrl) await handleAppUrl(launchUrl)
  await SplashScreen.hide()
}
void initMonitoring(app)
void syncLocaleFromAccount()

if (!Capacitor.isNativePlatform()) void registerSW({ immediate: true })
