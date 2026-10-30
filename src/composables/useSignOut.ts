import axios from 'axios'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { logout } from '../api'
import { i18n } from '../i18n'
import { notify } from './notify'
import { useAudioPlayer } from './useAudioPlayer'
import { useParty } from './useParty'
import { clearPluginPages } from './usePluginPages'
import { useProfile } from './useProfile'
import { useVideoOverlay } from './useVideoOverlay'
import { catchError } from '../utils/catchError'

function notifySignOutError(error: unknown) {
  if (axios.isAxiosError(error) && error.response?.status !== 401) {
    notify.error(i18n.global.t('errors.signOutNetwork'))
  } else if (!axios.isAxiosError(error)) {
    notify.error(i18n.global.t('errors.signOutGeneric'))
  }
}

export function useSignOut() {
  const router = useRouter()
  const isSigningOut = ref(false)

  async function signOut() {
    isSigningOut.value = true

    try {
      try {
        useAudioPlayer().stop()
        useVideoOverlay().close()
      } catch (error: unknown) {
        notifySignOutError(error)
        return
      }
      const [partyError] = await catchError(useParty().leave())
      if (partyError) {
        notifySignOutError(partyError)
        return
      }
      const [logoutError] = await catchError(logout())
      if (logoutError) {
        notifySignOutError(logoutError)
        return
      }
      useProfile().clear()
      clearPluginPages()
      const [navigationError] = await catchError(router.replace({ name: 'login' }))
      if (navigationError) notifySignOutError(navigationError)
    } finally {
      isSigningOut.value = false
    }
  }

  return { isSigningOut, signOut }
}
