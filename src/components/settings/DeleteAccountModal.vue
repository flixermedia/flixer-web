<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { deleteAccount } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import TextInput from '../ui/TextInput.vue'

defineOptions({ modalGroup: 'default' })

const { close, confirm } = useModalContext<boolean>()
const { t } = useI18n()

const password = ref('')
const isDeleting = ref(false)

async function submit() {
  isDeleting.value = true
  try {
    await deleteAccount(password.value)
    confirm(true)
  } catch (error: unknown) {
    console.error('[settings] account deletion failed', error)
    notify.error(describeRequestError(error, t('settings.profile.deleteFailed')))
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card w-full max-w-md rounded-2xl border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <div class="flex size-11 items-center justify-center rounded-full bg-rose-400/10 text-rose-300">
        <svg class="size-5 fill-none stroke-current" viewBox="0 0 20 20" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M10 6v5M10 14h.01M8.6 3.5 2.5 14a1.6 1.6 0 0 0 1.4 2.4h12.2a1.6 1.6 0 0 0 1.4-2.4L11.4 3.5a1.6 1.6 0 0 0-2.8 0Z" />
        </svg>
      </div>
      <ModalTitle class="mt-4 text-lg font-semibold">{{ t('settings.profile.deleteConfirmTitle') }}</ModalTitle>
      <ModalDescription class="mt-1 text-sm leading-6 text-flixer-muted">{{ t('settings.profile.deleteConfirmDescription') }}</ModalDescription>

      <form class="mt-5 flex flex-col gap-5" @submit.prevent="submit">
        <TextInput v-model="password" :label="t('settings.profile.passwordLabel')" type="password" name="deletePassword" autocomplete="current-password" maxlength="128" required autofocus />

        <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" class="flex h-11 items-center justify-center rounded-lg border border-flixer-border px-6 text-sm font-semibold text-flixer-text transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" :disabled="isDeleting" @click="close()">{{ t('common.cancel') }}</button>
          <button type="submit" class="flex h-11 items-center justify-center rounded-lg bg-rose-500 px-6 text-sm font-semibold text-white shadow-lg shadow-rose-500/20 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300 disabled:cursor-wait disabled:opacity-60" :disabled="isDeleting || !password">
            {{ isDeleting ? t('settings.profile.deleting') : t('settings.profile.deleteAccountButton') }}
          </button>
        </div>
      </form>
    </ModalContent>
  </ModalRoot>
</template>
