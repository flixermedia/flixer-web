import { openModal } from '@kolirt/vue-modal'
import { computed, ref } from 'vue'
import { getAccessMe, lockAccess, type AccessMe } from '../api'
import UnlockModal from '../components/access/UnlockModal.vue'

const me = ref<AccessMe | null>(null)

/** The signed-in user's viewing limits, shared across the app. */
export function useAccess() {
  async function refresh() {
    me.value = await getAccessMe().catch(() => me.value)
    return me.value
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
    requestUnlock,
    relock,
    isUnlocked: computed(() => Boolean(me.value?.unlockedUntil)),
    canUnlock: computed(() => Boolean(me.value?.hasPin)),
    hasLimits: computed(() => Boolean(me.value && (me.value.enforced || me.value.unlockedUntil))),
  }
}
