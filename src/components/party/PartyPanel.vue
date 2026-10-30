<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useParty } from '../../composables/useParty'
import { notify } from '../../composables/notify'
import UserAvatar from '../ui/UserAvatar.vue'
import { catchError } from '../../utils/catchError'

const emit = defineEmits<{ left: [] }>()
const { t } = useI18n()
const party = useParty()
const busy = ref(false)

async function copyLink() {
  const [failure] = await catchError(navigator.clipboard.writeText(party.inviteLink()))
  if (failure) {
    notify.error(t('party.copyFailed'))
    return
  }
  notify.success(t('party.linkCopied'))
}

async function leave() {
  busy.value = true
  try {
    await party.leave()
    emit('left')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <section v-if="party.party.value" :aria-label="t('party.title')">
    <p class="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-flixer-muted">{{ t('party.title') }}</p>
    <div class="px-3 pb-2">
      <p class="truncate text-sm text-flixer-text">{{ party.party.value.item.title }}</p>
      <p class="truncate text-xs text-flixer-muted">{{ party.isHost.value ? t('party.youAreHost') : t('party.hostedBy', { name: party.party.value.host.displayName }) }}</p>
    </div>

    <div class="my-2 border-t border-flixer-border"></div>

    <p class="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-flixer-muted">{{ t('party.members') }} · {{ party.party.value.members.length }}</p>
    <ul :aria-label="t('party.members')">
      <li v-for="member in party.party.value.members" :key="member.id">
        <RouterLink :to="{ name: 'profile', params: { username: member.username } }" class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-flixer-text transition hover:bg-white/10">
          <span class="block size-6 shrink-0 overflow-hidden rounded"><UserAvatar :avatar-url="member.avatarUrl" :name="member.displayName" class="text-[10px]" /></span>
          <span class="truncate">{{ member.displayName }}</span>
          <span v-if="member.id === party.party.value.host.id" class="ml-auto text-xs text-flixer-accent">{{ t('party.host') }}</span>
        </RouterLink>
      </li>
    </ul>

    <div class="my-2 border-t border-flixer-border"></div>

    <button type="button" class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-flixer-text transition hover:bg-white/10" @click="copyLink">{{ t('party.copyLink') }}</button>
    <button type="button" class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-flixer-text transition hover:bg-white/10 disabled:opacity-60" :disabled="busy" @click="leave">{{ party.isHost.value ? t('party.end') : t('party.leave') }}</button>
    <p v-if="party.isGuest.value" class="px-3 pb-2 pt-2 text-xs text-flixer-muted">{{ t('party.guestHint') }}</p>
  </section>
</template>
