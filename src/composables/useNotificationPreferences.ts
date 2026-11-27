import { computed, ref } from 'vue'
import {
  getAccessToken,
  getPreferences,
  updatePreferences,
  type NotificationCategoryPreferences,
  type NotificationPreferences,
} from '../api'
import { catchError } from '../utils/catchError'
import { notify } from './notify'
import { describeRequestError } from './useProfile'

const DEFAULT_CATEGORIES: NotificationCategoryPreferences = {
  message: true,
  new_media: true,
  request: true,
  system: true,
  admin: true,
}

export function defaultNotificationPreferences(): NotificationPreferences {
  return {
    chatChime: true,
    chatChimeWhileOpen: true,
    chatToasts: true,
    pushEnabled: true,
    categories: { ...DEFAULT_CATEGORIES },
  }
}

function mergeNotificationPreferences(raw?: Partial<NotificationPreferences> | null): NotificationPreferences {
  const defaults = defaultNotificationPreferences()
  if (!raw || typeof raw !== 'object') return defaults
  return {
    chatChime: raw.chatChime ?? defaults.chatChime,
    chatChimeWhileOpen: raw.chatChimeWhileOpen ?? defaults.chatChimeWhileOpen,
    chatToasts: raw.chatToasts ?? defaults.chatToasts,
    pushEnabled: raw.pushEnabled ?? defaults.pushEnabled,
    categories: {
      message: raw.categories?.message ?? defaults.categories.message,
      new_media: raw.categories?.new_media ?? defaults.categories.new_media,
      request: raw.categories?.request ?? defaults.categories.request,
      system: raw.categories?.system ?? defaults.categories.system,
      admin: raw.categories?.admin ?? defaults.categories.admin,
    },
  }
}

const prefs = ref<NotificationPreferences>(defaultNotificationPreferences())
const loaded = ref(false)
const loading = ref(false)
const saving = ref(false)

async function load(force = false) {
  if (!getAccessToken()) return
  if (loaded.value && !force) return
  loading.value = true
  try {
    const [err, data] = await catchError(getPreferences())
    if (!err && data) {
      prefs.value = mergeNotificationPreferences(data.notifications)
      loaded.value = true
    }
  } finally {
    loading.value = false
  }
}

async function save(next: NotificationPreferences) {
  const prev = prefs.value
  prefs.value = next
  saving.value = true
  try {
    const [err, saved] = await catchError(updatePreferences({ notifications: next }))
    if (err) {
      prefs.value = prev
      notify.error(describeRequestError(err))
      return false
    }
    if (saved) {
      prefs.value = mergeNotificationPreferences(saved.notifications)
    }
    return true
  } finally {
    saving.value = false
  }
}

function setFlag<K extends Exclude<keyof NotificationPreferences, 'categories'>>(key: K, value: boolean) {
  const next: NotificationPreferences = {
    ...prefs.value,
    categories: { ...prefs.value.categories },
    [key]: value,
  }
  return save(next)
}

function setCategory(key: keyof NotificationCategoryPreferences, value: boolean) {
  const next: NotificationPreferences = {
    ...prefs.value,
    categories: {
      ...prefs.value.categories,
      [key]: value,
    },
  }
  return save(next)
}

export function useNotificationPreferences() {
  return {
    preferences: computed(() => prefs.value),
    loaded: computed(() => loaded.value),
    loading: computed(() => loading.value),
    saving: computed(() => saving.value),
    load,
    save,
    setFlag,
    setCategory,
  }
}
