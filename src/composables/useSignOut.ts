import axios from 'axios'
import { ref } from 'vue'
import { clearAccessToken, logout } from '../api'
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
  const isSigningOut = ref(false)

  async function signOut() {
    isSigningOut.value = true

    try {
      let signOutError: unknown

      try {
        useAudioPlayer().stop()
        useVideoOverlay().close()
      } catch (error: unknown) {
        signOutError = error
      }

      const [partyError] = await catchError(Promise.resolve().then(() => useParty().leave()))
      signOutError ??= partyError

      const [logoutError] = await catchError(logout())
      signOutError ??= logoutError

      const [cleanupError] = await catchError(
        Promise.resolve().then(() => {
          clearAccessToken()
          useProfile().clear()
          clearPluginPages()
        }),
      )
      signOutError ??= cleanupError

      if (signOutError) notifySignOutError(signOutError)
      window.location.replace('/login')
    } finally {
      isSigningOut.value = false
    }
  }

  return { isSigningOut, signOut }
}
