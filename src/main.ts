import { createModal, type DefineGroups } from '@kolirt/vue-modal'
import { createApp } from 'vue'
import { registerSW } from 'virtual:pwa-register'
import Vue3Toastify from 'vue3-toastify'
import { AUTH_INVALID_EVENT } from './api'
import { toastContainerOptions } from './composables/notify'
import { i18n, initLocale } from './i18n'
import router from './router'
import './tailwind.css'
import './toast.css'
import './modal.css'
import App from './App.vue'

declare module '@kolirt/vue-modal' {
  interface ModalGroupRegistry extends DefineGroups<['default']> {}
}

const app = createApp(App)

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

void registerSW({ immediate: true })
