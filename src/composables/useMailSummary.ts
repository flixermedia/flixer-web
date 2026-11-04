import { ref } from 'vue'
import { AUTH_TOKEN_CHANGED_EVENT, getAccessToken, getMyMailInfo, type MailMe } from '../api'

const info = ref<MailMe | null>(null)
let initialized = false
let loading: Promise<void> | null = null
let requestGeneration = 0

export function useMailSummary() {
  async function refresh(force = false) {
    if (!getAccessToken()) {
      requestGeneration += 1
      loading = null
      info.value = null
      return
    }
    if (info.value && !force) return
    if (force) {
      requestGeneration += 1
      loading = null
    }
    if (!loading) {
      const generation = requestGeneration
      loading = getMyMailInfo()
        .then((result) => { if (generation === requestGeneration) info.value = result })
        .catch(() => { if (generation === requestGeneration) info.value = null })
        .finally(() => { if (generation === requestGeneration) loading = null })
    }
    return loading
  }

  if (!initialized && typeof window !== 'undefined') {
    initialized = true
    window.addEventListener(AUTH_TOKEN_CHANGED_EVENT, () => { void refresh(true) })
    if (getAccessToken()) void refresh()
  }

  return { info, refresh }
}
