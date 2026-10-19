import axios from 'axios'
import { ref } from 'vue'
import { getProfile, type UserProfile } from '../api'
import { i18n } from '../i18n'

const profile = ref<UserProfile | null>(null)
let pending: Promise<void> | null = null

// Shared across components so the header and the settings page stay in sync.
export function useProfile() {
  function load(force = false): Promise<void> {
    if (!force && profile.value) {
      return Promise.resolve()
    }
    pending ??= getProfile()
      .then((result) => {
        profile.value = result
      })
      .catch((error: unknown) => {
        console.error('[profile] failed to load', error)
      })
      .finally(() => {
        pending = null
      })
    return pending
  }

  function setProfile(next: UserProfile) {
    profile.value = next
  }

  function clear() {
    profile.value = null
  }

  return { profile, load, setProfile, clear }
}

export function describeRequestError(error: unknown, fallback = i18n.global.t('errors.generic')): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    if (!error.response) {
      return i18n.global.t('errors.network')
    }
    return error.response.data?.message || fallback
  }
  return error instanceof Error && error.message ? error.message : fallback
}
