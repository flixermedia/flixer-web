import axios from 'axios'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { logout } from '../api'
import { i18n } from '../i18n'
import { notify } from './notify'
import { clearPluginPages } from './usePluginPages'
import { useProfile } from './useProfile'

export function useSignOut() {
  const router = useRouter()
  const isSigningOut = ref(false)

  async function signOut() {
    isSigningOut.value = true

    try {
      await logout()
      useProfile().clear()
      clearPluginPages()
      await router.replace({ name: 'login' })
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status !== 401) {
        notify.error(i18n.global.t('errors.signOutNetwork'))
      } else if (!axios.isAxiosError(error)) {
        notify.error(i18n.global.t('errors.signOutGeneric'))
      }
    } finally {
      isSigningOut.value = false
    }
  }

  return { isSigningOut, signOut }
}
