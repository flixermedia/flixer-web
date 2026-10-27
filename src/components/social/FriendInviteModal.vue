<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { createFriendInvite, type FriendInviteMode } from '../../api'

defineOptions({ modalGroup: 'default' })

const props = defineProps<{ username: string }>()
const { close } = useModalContext<void>()
const { t } = useI18n()
const router = useRouter()
const mode = ref<FriendInviteMode>('once')
const duration = ref(24)
const durationUnit = ref<'hours' | 'days'>('hours')
const link = ref('')
const busy = ref(false)
const error = ref(false)
const copied = ref(false)
const shareAvailable = computed(() => Capacitor.isNativePlatform() || typeof navigator.share === 'function')

async function createLink() {
  if (busy.value) return
  busy.value = true
  error.value = false
  try {
    const expiresInHours = mode.value === 'expires' ? duration.value * (durationUnit.value === 'days' ? 24 : 1) : undefined
    const { token } = await createFriendInvite(props.username, {
      mode: mode.value,
      expiresInHours,
    })
    link.value = new URL(router.resolve({ name: 'friend-invite', params: { token } }).href, window.location.origin).toString()
  } catch {
    error.value = true
  } finally {
    busy.value = false
  }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(link.value)
    copied.value = true
  } catch {
    error.value = true
  }
}

async function shareLink() {
  try {
    if (Capacitor.isNativePlatform()) {
      await Share.share({ title: t('social.shareProfile'), url: link.value, dialogTitle: t('social.shareProfile') })
    } else {
      await navigator.share({ title: t('social.shareProfile'), url: link.value })
    }
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') return
    error.value = true
  }
}
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-y-auto rounded-2xl border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <ModalTitle class="text-lg font-semibold text-white">{{ t('social.friendInvite.title') }}</ModalTitle>
      <ModalDescription class="mt-1 text-sm leading-6 text-flixer-muted">{{ t('social.friendInvite.optionsDescription') }}</ModalDescription>
      <div v-if="!link" class="mt-5 space-y-3">
        <label class="flex cursor-pointer items-start gap-3 rounded-lg border border-flixer-border p-3 hover:bg-white/5">
          <input v-model="mode" type="radio" value="once" class="mt-1 accent-flixer-accent" />
          <span
            ><span class="block text-sm font-semibold text-white">{{ t('social.friendInvite.once') }}</span
            ><span class="mt-1 block text-xs text-flixer-muted">{{ t('social.friendInvite.onceDescription') }}</span></span
          >
        </label>
        <label class="flex cursor-pointer items-start gap-3 rounded-lg border border-flixer-border p-3 hover:bg-white/5">
          <input v-model="mode" type="radio" value="unlimited" class="mt-1 accent-flixer-accent" />
          <span
            ><span class="block text-sm font-semibold text-white">{{ t('social.friendInvite.unlimited') }}</span
            ><span class="mt-1 block text-xs text-flixer-muted">{{ t('social.friendInvite.unlimitedDescription') }}</span></span
          >
        </label>
        <label class="block cursor-pointer rounded-lg border border-flixer-border p-3 hover:bg-white/5">
          <span class="flex items-start gap-3">
            <input v-model="mode" type="radio" value="expires" class="mt-1 accent-flixer-accent" />
            <span
              ><span class="block text-sm font-semibold text-white">{{ t('social.friendInvite.expires') }}</span
              ><span class="mt-1 block text-xs text-flixer-muted">{{ t('social.friendInvite.expiresDescription') }}</span></span
            >
          </span>
          <span class="mt-3 flex items-center gap-2 pl-6">
            <input v-model.number="duration" type="number" min="1" :max="durationUnit === 'days' ? 365 : 8760" class="w-24 rounded-lg border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-flixer-accent" :aria-label="t('social.friendInvite.duration')" :disabled="mode !== 'expires'" />
            <select v-model="durationUnit" class="rounded-lg border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-flixer-accent" :aria-label="t('social.friendInvite.durationUnit')" :disabled="mode !== 'expires'">
              <option value="hours">{{ t('social.friendInvite.hours') }}</option>
              <option value="days">{{ t('social.friendInvite.days') }}</option>
            </select>
          </span>
        </label>
        <p v-if="mode === 'expires' && (!Number.isInteger(duration) || duration < 1 || duration > (durationUnit === 'days' ? 365 : 8760))" class="text-sm text-red-400" role="alert">{{ t('social.friendInvite.durationInvalid') }}</p>
        <p v-if="error" class="text-sm text-red-400" role="alert">{{ t('social.friendInvite.createFailed') }}</p>
        <div class="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <button type="button" class="h-11 rounded-lg border border-flixer-border px-5 text-sm font-semibold hover:bg-white/5" @click="close()">{{ t('common.cancel') }}</button>
          <button type="button" class="h-11 rounded-lg bg-white px-5 text-sm font-bold text-flixer-background disabled:opacity-50" :disabled="busy || (mode === 'expires' && (!Number.isInteger(duration) || duration < 1 || duration > (durationUnit === 'days' ? 365 : 8760)))" @click="createLink">{{ busy ? t('social.saving') : t('social.friendInvite.createLink') }}</button>
        </div>
      </div>
      <div v-else class="mt-5 space-y-4">
        <label class="block space-y-2 text-sm font-medium text-white">
          <span>{{ t('social.friendInvite.link') }}</span>
          <input :value="link" readonly class="w-full rounded-lg border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-flixer-accent" />
        </label>
        <p v-if="error" class="text-sm text-red-400" role="alert">{{ t('social.friendInvite.shareFailed') }}</p>
        <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" class="h-11 rounded-lg border border-flixer-border px-5 text-sm font-semibold hover:bg-white/5" @click="close()">{{ t('common.close') }}</button>
          <button v-if="shareAvailable" type="button" class="h-11 rounded-lg border border-flixer-border px-5 text-sm font-semibold hover:bg-white/5" @click="shareLink">{{ t('social.friendInvite.share') }}</button>
          <button type="button" class="h-11 rounded-lg bg-white px-5 text-sm font-bold text-flixer-background" @click="copyLink">{{ copied ? t('social.friendInvite.copied') : t('social.friendInvite.copyLink') }}</button>
        </div>
      </div>
    </ModalContent>
  </ModalRoot>
</template>
