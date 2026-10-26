<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useParty } from '../../composables/useParty'
import { useVideoOverlay } from '../../composables/useVideoOverlay'
import PartyPanel from './PartyPanel.vue'

const { t } = useI18n()
const party = useParty()
const { playing } = useVideoOverlay()
const open = ref(false)

const current = computed(() => party.party.value)
const music = computed(() => current.value?.kind === 'music')
const reconnecting = computed(() => party.status.value === 'reconnecting')
// While a video is open, the party controls live in the player's own control bar.
const visible = computed(() => !!current.value && !(current.value.kind === 'video' && playing.value))

// The host usually wants the invite link straight away.
watch(
  () => current.value?.id,
  (id) => {
    open.value = !!id && party.isHost.value
  },
)
</script>

<template>
  <div v-if="visible && current" class="theme-dark fixed right-4 top-24 z-[120] w-[min(20rem,calc(100vw-2rem))] text-white">
    <button type="button" class="ml-auto flex items-center gap-2 rounded border border-white/15 bg-black/80 px-3 py-2 text-xs font-semibold shadow-xl shadow-black/50 backdrop-blur transition hover:bg-black/90" :aria-expanded="open" @click="open = !open">
      <span class="size-2 rounded-full motion-reduce:animate-none" :class="reconnecting ? 'bg-amber-400' : 'animate-pulse bg-emerald-400'" aria-hidden="true" />
      {{ reconnecting ? t('party.reconnecting') : t(music ? 'party.listeningTogether' : 'party.watchingTogether') }}
      <span class="rounded bg-white/15 px-1.5 py-0.5 tabular-nums">{{ current.members.length }}</span>
    </button>
    <Transition name="party">
      <div v-if="open" class="mt-2 rounded border border-white/15 bg-black/85 p-4 shadow-2xl shadow-black/60 backdrop-blur"><PartyPanel @left="open = false" /></div>
    </Transition>
  </div>
</template>

<style scoped>
.party-enter-active,
.party-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.party-enter-from,
.party-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}
@media (prefers-reduced-motion: reduce) {
  .party-enter-active,
  .party-leave-active {
    transition: none;
  }
}
</style>
