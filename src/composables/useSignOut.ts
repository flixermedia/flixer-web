import axios from 'axios'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { logout } from '../api'
import { notify } from './notify'
import { useProfile } from './useProfile'

export function useSignOut() {
  const router = useRouter()
  const isSigningOut = ref(false)

  async function signOut() {
    isSigningOut.value = true

    try {
      await logout()
      useProfile().clear()
      await router.replace({ name: 'login' })
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status !== 401) {
        notify.error('Flixer couldn’t sign you out. Check your connection and try again.')
      } else if (!axios.isAxiosError(error)) {
        notify.error('Something went wrong while signing out. Please try again.')
      }
    } finally {
      isSigningOut.value = false
    }
  }

  return { isSigningOut, signOut }
}
