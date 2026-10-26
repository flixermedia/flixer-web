import { onBeforeUnmount, onMounted, ref } from 'vue'

/** Loads a widget's data once and then every `intervalMs`; a failed refresh keeps the last data and sets `failed`. */
export function useWidgetData<T>(load: () => Promise<T>, intervalMs = 15000) {
  const data = ref<T | null>(null)
  const failed = ref(false)
  let timer: ReturnType<typeof setInterval> | undefined

  async function refresh() {
    try {
      data.value = (await load()) as never
      failed.value = false
    } catch (error: unknown) {
      console.error('[dashboard] widget failed to load', error)
      failed.value = true
    }
  }

  onMounted(() => {
    void refresh()
    timer = setInterval(() => void refresh(), intervalMs)
  })
  onBeforeUnmount(() => clearInterval(timer))
  return { data, failed, refresh }
}
