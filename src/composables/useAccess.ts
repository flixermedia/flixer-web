import { openModal } from '@kolirt/vue-modal'
import { computed, ref } from 'vue'
import { getAccessMe, lockAccess, type AccessMe } from '../api'
import UnlockModal from '../components/access/UnlockModal.vue'

const me = ref<AccessMe | null>(null)
let pending: Promise<AccessMe | null> | null = null
let fetchedAt = 0
const MOUNT_FRESH_MS = 30_000

/** The signed-in user's viewing limits, shared across the app. */
export function useAccess() {
  // Several components ask on mount; they share one request instead of each issuing their own.
  function refresh() {
    pending ??= getAccessMe()
      .catch(() => me.value)
      .then((next) => {
        me.value = next
        fetchedAt = Date.now()
        return next
      })
      .finally(() => {
        pending = null
      })
    return pending
  }

  /** For component mounts: the header remounts on every page, so recent data is reused. */
  function load() {
    return me.value && Date.now() - fetchedAt < MOUNT_FRESH_MS ? Promise.resolve(me.value) : refresh()
  }

  /** Asks for the override PIN. Resolves true when the device was unlocked. */
  async function requestUnlock() {
    return (await openModal<boolean>(UnlockModal).catch(() => false)) === true
  }

  async function relock() {
    me.value = await lockAccess()
    window.location.reload()
  }

  return {
    me,
    refresh,
    load,
    requestUnlock,
    relock,
    isUnlocked: computed(() => Boolean(me.value?.unlockedUntil)),
    canUnlock: computed(() => Boolean(me.value?.hasPin)),
    hasLimits: computed(() => Boolean(me.value && (me.value.enforced || me.value.unlockedUntil))),
  }
}
