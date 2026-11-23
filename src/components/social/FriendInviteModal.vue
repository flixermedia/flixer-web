<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'
import { Button } from '@ui-sdk/vue/button'
import { Input } from '@ui-sdk/vue/input'
import { Radio, RadioGroup } from '@ui-sdk/vue/radio'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { createFriendInvite, type FriendInviteMode } from '../../api'
import { catchError } from '../../utils/catchError'
import { copyToClipboard } from '../../utils/clipboard'

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
const radioMarkClass = 'mt-1 size-4 shrink-0 rounded-full border border-flixer-muted group-data-checked:border-flixer-accent group-data-checked:bg-flixer-accent group-data-checked:shadow-[inset_0_0_0_3px_var(--color-flixer-background)]'

async function createLink() {
  if (busy.value) return
  busy.value = true
  error.value = false
  try {
    const expiresInHours = mode.value === 'expires' ? duration.value * (durationUnit.value === 'days' ? 24 : 1) : undefined
    const [failure, invite] = await catchError(
      createFriendInvite(props.username, {
        mode: mode.value,
        expiresInHours,
      }),
    )
    if (failure) {
      error.value = true
      return
    }
    link.value = new URL(router.resolve({ name: 'friend-invite', params: { token: invite.token } }).href, window.location.origin).toString()
  } finally {
    busy.value = false
  }
}

async function copyLink() {
  const success = await copyToClipboard(link.value)
  if (!success) {
    error.value = true
    return
  }
  copied.value = true
}

async function shareLink() {
  const [cause] = Capacitor.isNativePlatform() ? await catchError(Share.share({ title: t('social.shareProfile'), url: link.value, dialogTitle: t('social.shareProfile') }).then(() => undefined)) : await catchError(navigator.share({ title: t('social.shareProfile'), url: link.value }))
  if (cause) {
    if (cause.name === 'AbortError') return
    error.value = true
  }
}
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-y-auto rounded border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <header class="flixer-modal-header">
        <ModalTitle class="text-lg font-semibold text-white">{{ t('social.friendInvite.title') }}</ModalTitle>
        <ModalDescription class="mt-1 text-sm leading-6 text-flixer-muted">{{ t('social.friendInvite.optionsDescription') }}</ModalDescription>
      </header>
      <div v-if="!link" class="mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain">
        <RadioGroup :value="mode" :aria-label="t('social.friendInvite.title')" class="grid gap-3" @update:value="(value) => { if (value === 'once' || value === 'unlimited' || value === 'expires') mode = value }">
          <Radio v-for="option in ['once', 'unlimited'] as const" :key="option" :value="option" class="group flex h-auto w-full cursor-pointer items-start justify-start gap-3 rounded border border-flixer-border bg-transparent p-3 text-left hover:bg-white/5">
            <span aria-hidden="true" :class="radioMarkClass" />
            <span>
              <span class="block text-sm font-semibold text-white">{{ t(`social.friendInvite.${option}`) }}</span>
              <span class="mt-1 block text-xs text-flixer-muted">{{ t(`social.friendInvite.${option}Description`) }}</span>
            </span>
          </Radio>
          <div class="rounded border border-flixer-border p-3 hover:bg-white/5">
            <Radio value="expires" class="group flex h-auto w-full cursor-pointer items-start justify-start gap-3 border-0 bg-transparent p-0 text-left hover:bg-transparent">
              <span aria-hidden="true" :class="radioMarkClass" />
              <span>
                <span class="block text-sm font-semibold text-white">{{ t('social.friendInvite.expires') }}</span>
                <span class="mt-1 block text-xs text-flixer-muted">{{ t('social.friendInvite.expiresDescription') }}</span>
              </span>
            </Radio>
            <span class="mt-3 flex items-center gap-2 pl-6">
              <input v-model.number="duration" type="number" min="1" :max="durationUnit === 'days' ? 365 : 8760" class="w-24 rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-flixer-accent" :aria-label="t('social.friendInvite.duration')" :disabled="mode !== 'expires'" />
              <select v-model="durationUnit" class="rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-flixer-accent" :aria-label="t('social.friendInvite.durationUnit')" :disabled="mode !== 'expires'">
                <option value="hours">{{ t('social.friendInvite.hours') }}</option>
                <option value="days">{{ t('social.friendInvite.days') }}</option>
              </select>
            </span>
          </div>
        </RadioGroup>
        <p v-if="mode === 'expires' && (!Number.isInteger(duration) || duration < 1 || duration > (durationUnit === 'days' ? 365 : 8760))" class="text-sm text-red-400" role="alert">{{ t('social.friendInvite.durationInvalid') }}</p>
        <p v-if="error" class="text-sm text-red-400" role="alert">{{ t('social.friendInvite.createFailed') }}</p>
      </div>
      <div v-else class="mt-5 min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain">
        <label class="block space-y-2 text-sm font-medium text-white">
          <span>{{ t('social.friendInvite.link') }}</span>
          <Input data-agent-hidden :value="link" readonly class="h-auto w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-flixer-accent" />
        </label>
        <p v-if="error" class="text-sm text-red-400" role="alert">{{ t('social.friendInvite.shareFailed') }}</p>
      </div>
      <div v-if="!link" class="flixer-modal-actions mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" class="h-11 rounded border border-flixer-border bg-transparent px-5 text-sm font-semibold text-flixer-text hover:bg-white/5" @click="close()">{{ t('common.cancel') }}</Button>
        <Button type="button" :data-agent-confirm="t('social.friendInvite.createLink')" class="h-11 rounded border-0 bg-flixer-primary px-5 text-sm font-bold text-white hover:bg-flixer-primary disabled:opacity-50" :disabled="busy || (mode === 'expires' && (!Number.isInteger(duration) || duration < 1 || duration > (durationUnit === 'days' ? 365 : 8760)))" @click="createLink">{{ busy ? t('social.saving') : t('social.friendInvite.createLink') }}</Button>
      </div>
      <div v-else class="flixer-modal-actions mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" class="h-11 rounded border border-flixer-border bg-transparent px-5 text-sm font-semibold text-flixer-text hover:bg-white/5" @click="close()">{{ t('common.close') }}</Button>
        <Button v-if="shareAvailable" data-agent-hidden type="button" class="h-11 rounded border border-flixer-border bg-transparent px-5 text-sm font-semibold text-flixer-text hover:bg-white/5" @click="shareLink">{{ t('social.friendInvite.share') }}</Button>
        <Button data-agent-hidden type="button" class="h-11 rounded border-0 bg-flixer-primary px-5 text-sm font-bold text-white hover:bg-flixer-primary" @click="copyLink">{{ copied ? t('social.friendInvite.copied') : t('social.friendInvite.copyLink') }}</Button>
      </div>
    </ModalContent>
  </ModalRoot>
</template>
