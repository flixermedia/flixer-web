import { createModal, type DefineGroups } from '@kolirt/vue-modal'
import { Capacitor } from '@capacitor/core'
import { createApp } from 'vue'
import { registerSW } from 'virtual:pwa-register'
import Vue3Toastify from 'vue3-toastify'
import { AUTH_INVALID_EVENT } from './api'
import { toastContainerOptions } from './composables/notify'
import { initTheme } from './composables/useTheme'
import { i18n, initLocale, syncLocaleFromAccount } from './i18n'
import { initMonitoring } from './monitoring'
import router from './router'
import './tailwind.css'
import './toast.css'
import './modal.css'
import App from './App.vue'

declare module '@kolirt/vue-modal' {
  interface ModalGroupRegistry extends DefineGroups<['default']> {}
}

const app = createApp(App)
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
await initLocale()
app.mount('#app')
void initMonitoring(app)
void syncLocaleFromAccount()

if (!Capacitor.isNativePlatform()) void registerSW({ immediate: true })
