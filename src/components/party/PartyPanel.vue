<script setup lang="ts">
import { Button } from '@ui-sdk/vue/button'
import { Toggle } from '@ui-sdk/vue/toggle'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useParty } from '../../composables/useParty'
import { usePartyVoice } from '../../composables/usePartyVoice'
import { notify } from '../../composables/notify'
import UserAvatar from '../ui/UserAvatar.vue'
import { copyToClipboard } from '../../utils/clipboard'

const emit = defineEmits<{ left: [] }>()
const { t } = useI18n()
const party = useParty()
const voice = usePartyVoice()
const busy = ref(false)

async function copyLink() {
  const ok = await copyToClipboard(party.inviteLink())
  if (!ok) {
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

    <div v-if="party.partyLocked.value" class="mx-3 mb-2 rounded border border-amber-400/30 bg-amber-400/10 p-3" role="status">
      <p class="text-xs text-amber-200">{{ t('party.lockedNotice') }}</p>
      <Button data-agent-hidden type="button" class="mt-2 h-auto w-full rounded border-0 bg-white px-3 py-2 text-xs font-bold whitespace-normal text-flixer-background transition hover:bg-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" @click="void party.unlockItem()">{{ t('payments.lock.unlock') }}</Button>
    </div>

    <div class="my-2 border-t border-flixer-border"></div>

    <div v-if="voice.available.value" data-agent-hidden class="px-3 pb-2">
      <p class="pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-flixer-muted">{{ t('party.voice.title') }}</p>
      <p v-if="voice.notice.value" class="pb-2 text-xs text-amber-200" role="status">{{ t(`chat.call.notice.${voice.notice.value}`) }}</p>
      <Button v-if="!voice.active.value" type="button" class="h-auto w-full rounded border-0 bg-white px-3 py-2 text-xs font-bold whitespace-normal text-flixer-background transition hover:bg-white/85 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" :disabled="voice.joining.value" @click="void voice.join()">{{ t('party.voice.join') }}</Button>
      <template v-else>
        <p class="pb-2 text-xs text-flixer-muted" role="status">{{ t('party.voice.connected', { count: voice.peerCount.value }) }} · {{ t('chat.call.e2ee') }}</p>
        <div class="flex gap-2">
          <Toggle class="h-auto flex-1 rounded border border-flixer-border bg-transparent px-3 py-2 text-xs font-normal whitespace-normal text-flixer-text transition hover:bg-white/10 data-pressed:border-flixer-border data-pressed:bg-transparent data-pressed:hover:bg-white/10" :pressed="voice.micMuted.value" @update:pressed="voice.toggleMic()">{{ voice.micMuted.value ? t('chat.call.unmute') : t('chat.call.mute') }}</Toggle>
          <Button type="button" class="h-auto flex-1 rounded border border-flixer-border bg-transparent px-3 py-2 text-xs font-normal whitespace-normal text-flixer-text transition hover:bg-white/10" @click="void voice.leave()">{{ t('party.voice.leave') }}</Button>
        </div>
      </template>
    </div>

    <div class="my-2 border-t border-flixer-border"></div>

    <p class="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-flixer-muted">{{ t('party.members') }} · {{ party.party.value.members.length }}</p>
    <ul :aria-label="t('party.members')">
      <li v-for="member in party.party.value.members" :key="member.id">
        <RouterLink :to="{ name: 'profile', params: { username: member.username } }" class="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm text-flixer-text transition hover:bg-white/10">
          <span class="block size-6 shrink-0 overflow-hidden rounded"><UserAvatar :avatar-url="member.avatarUrl" :name="member.displayName" class="text-[10px]" /></span>
          <span class="truncate">{{ member.displayName }}</span>
          <span v-if="member.id === party.party.value.host.id" class="ml-auto text-xs text-flixer-accent">{{ t('party.host') }}</span>
        </RouterLink>
      </li>
    </ul>

    <div class="my-2 border-t border-flixer-border"></div>

    <Button data-agent-hidden type="button" class="flex h-auto w-full items-center justify-between rounded border-0 bg-transparent px-3 py-2 text-left text-sm font-normal whitespace-normal text-flixer-text transition hover:bg-white/10" @click="void copyLink()">{{ t('party.copyLink') }}</Button>
    <Button data-agent-hidden type="button" class="flex h-auto w-full items-center justify-between rounded border-0 bg-transparent px-3 py-2 text-left text-sm font-normal whitespace-normal text-flixer-text transition hover:bg-white/10 disabled:opacity-60" :disabled="busy" @click="void leave()">{{ party.isHost.value ? t('party.end') : t('party.leave') }}</Button>
    <p v-if="party.isGuest.value" class="px-3 pb-2 pt-2 text-xs text-flixer-muted">{{ t('party.guestHint') }}</p>
  </section>
</template>
