import { computed, ref } from 'vue'
import { getIssueReportConfiguration, type IssueReportConfiguration } from '../api'
import { catchError } from '../utils/catchError'

const config = ref<IssueReportConfiguration | null>(null)
let request: Promise<void> | null = null

export function useIssueReportsConfig() {
  function load(force = false): Promise<void> {
    if (!force && config.value) return Promise.resolve()
    request ??= (async () => {
      try {
        const [error, value] = await catchError(getIssueReportConfiguration())
        config.value = error ? null : value
      } finally {
        request = null
      }
    })()
    return request
  }

  return { config, enabled: computed(() => config.value?.enabled === true), load, refresh: () => load(true) }
}
