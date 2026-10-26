<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useParty } from '../../composables/useParty'
import { notify } from '../../composables/notify'
import UserAvatar from '../ui/UserAvatar.vue'

const { t } = useI18n()
const party = useParty()
const open = ref(false)
const busy = ref(false)

const current = computed(() => party.party.value)
const music = computed(() => current.value?.kind === 'music')
const reconnecting = computed(() => party.status.value === 'reconnecting')

// The host usually wants the invite link straight away.
watch(
  () => current.value?.id,
  (id) => {
    open.value = !!id && party.isHost.value
  },
)

async function copyLink() {
  try {
    await navigator.clipboard.writeText(party.inviteLink())
    notify.success(t('party.linkCopied'))
  } catch {
    notify.error(t('party.copyFailed'))
  }
}

async function leave() {
  busy.value = true
  try {
    await party.leave()
    open.value = false
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div v-if="current" class="theme-dark fixed right-4 top-24 z-[120] w-[min(20rem,calc(100vw-2rem))] text-white">
    <button type="button" class="ml-auto flex items-center gap-2 rounded border border-white/15 bg-black/80 px-3 py-2 text-xs font-semibold shadow-xl shadow-black/50 backdrop-blur transition hover:bg-black/90" :aria-expanded="open" @click="open = !open">
      <span class="size-2 rounded-full motion-reduce:animate-none" :class="reconnecting ? 'bg-amber-400' : 'animate-pulse bg-emerald-400'" aria-hidden="true" />
      {{ reconnecting ? t('party.reconnecting') : t(music ? 'party.listeningTogether' : 'party.watchingTogether') }}
      <span class="rounded bg-white/15 px-1.5 py-0.5 tabular-nums">{{ current.members.length }}</span>
    </button>
    <Transition name="party">
      <section v-if="open" class="mt-2 rounded border border-white/15 bg-black/85 p-4 shadow-2xl shadow-black/60 backdrop-blur" :aria-label="t('party.title')">
        <p class="truncate text-sm font-semibold">{{ current.item.title }}</p>
        <p class="truncate text-xs text-white/60">{{ party.isHost.value ? t('party.youAreHost') : t('party.hostedBy', { name: current.host.displayName }) }}</p>
        <ul class="mt-3 flex flex-wrap gap-2" :aria-label="t('party.members')">
          <li v-for="member in current.members" :key="member.id">
            <RouterLink :to="{ name: 'profile', params: { username: member.username } }" class="flex items-center gap-2 rounded bg-white/10 py-1 pl-1 pr-2 text-xs hover:bg-white/20">
              <span class="block size-5 shrink-0 overflow-hidden rounded"><UserAvatar :avatar-url="member.avatarUrl" :name="member.displayName" class="text-[10px]" /></span>
              <span class="max-w-24 truncate">{{ member.displayName }}</span>
            </RouterLink>
          </li>
        </ul>
        <p v-if="party.isGuest.value" class="mt-3 text-xs text-white/50">{{ t('party.guestHint') }}</p>
        <div class="mt-4 flex gap-2">
          <button type="button" class="flex-1 rounded bg-white px-3 py-2 text-xs font-bold text-black transition hover:bg-white/85" @click="copyLink">{{ t('party.copyLink') }}</button>
          <button type="button" class="flex-1 rounded bg-white/10 px-3 py-2 text-xs font-semibold transition hover:bg-white/20 disabled:opacity-60" :disabled="busy" @click="leave">{{ party.isHost.value ? t('party.end') : t('party.leave') }}</button>
        </div>
      </section>
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
