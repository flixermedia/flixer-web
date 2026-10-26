<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useParty } from '../../composables/useParty'
import { notify } from '../../composables/notify'
import UserAvatar from '../ui/UserAvatar.vue'

const emit = defineEmits<{ left: [] }>()
const { t } = useI18n()
const party = useParty()
const busy = ref(false)

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
    emit('left')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <section v-if="party.party.value" :aria-label="t('party.title')">
    <p class="truncate text-sm font-semibold">{{ party.party.value.item.title }}</p>
    <p class="truncate text-xs text-white/60">{{ party.isHost.value ? t('party.youAreHost') : t('party.hostedBy', { name: party.party.value.host.displayName }) }}</p>
    <ul class="mt-3 flex flex-wrap gap-2" :aria-label="t('party.members')">
      <li v-for="member in party.party.value.members" :key="member.id">
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
</template>
