import { computed, ref } from 'vue'
import { getRequestsConfig, type RequestsConfig } from '../api'
import { catchError } from '../utils/catchError'

const config = ref<RequestsConfig | null>(null)
const loading = ref(false)
let request: Promise<void> | null = null

export function useRequestsConfig() {
  function load(force = false): Promise<void> {
    if (!force && config.value) return Promise.resolve()
    request ??= (async () => {
      loading.value = true
      try {
        const [error, value] = await catchError(getRequestsConfig())
        config.value = error ? null : value
      } finally {
        loading.value = false
        request = null
      }
    })()
    return request
  }

  return { config, loading, enabled: computed(() => config.value?.enabled === true), load, refresh: () => load(true) }
}
