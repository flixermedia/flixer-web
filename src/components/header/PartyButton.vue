<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useParty } from '../../composables/useParty'
import PartyPanel from '../party/PartyPanel.vue'

defineProps<{ buttonClass: string }>()

const { t } = useI18n()
const party = useParty()
const open = ref(false)
const root = ref<HTMLElement | null>(null)

const current = computed(() => party.party.value)
const reconnecting = computed(() => party.status.value === 'reconnecting')
const label = computed(() => (reconnecting.value ? t('party.reconnecting') : t(current.value?.kind === 'music' ? 'party.listeningTogether' : 'party.watchingTogether')))

function onDocumentClick(event: MouseEvent) {
  if (open.value && root.value && !root.value.contains(event.target as Node)) open.value = false
}

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape') open.value = false
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div v-if="current" ref="root" class="relative">
    <button type="button" :class="buttonClass" :aria-label="label" :title="label" aria-haspopup="dialog" :aria-expanded="open" @click="open = !open">
      <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM20 20v-1.5a3.5 3.5 0 0 0-2.5-3.35M15.5 4.15a3.5 3.5 0 0 1 0 6.7" />
      </svg>
      <span class="absolute right-1 top-1 grid min-w-4 place-items-center rounded px-1 text-[10px] font-bold leading-4 text-flixer-background" :class="reconnecting ? 'bg-amber-400' : 'bg-flixer-accent'">{{ current.members.length }}</span>
    </button>
    <Transition name="party-panel">
      <div v-if="open" class="theme-dark absolute right-0 top-12 z-50 w-64 max-w-[calc(100vw-2rem)] origin-top-right rounded-xl border border-flixer-border bg-flixer-surface p-2 text-flixer-text shadow-2xl shadow-black/60">
        <PartyPanel @left="open = false" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.party-panel-enter-active,
.party-panel-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.party-panel-enter-from,
.party-panel-leave-to {
  opacity: 0;
  transform: translateY(-0.25rem) scale(0.98);
}
@media (prefers-reduced-motion: reduce) {
  .party-panel-enter-active,
  .party-panel-leave-active {
    transition: none;
  }
}
</style>
