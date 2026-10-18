<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { ref } from 'vue'
import { deletePasskey } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import TextInput from '../ui/TextInput.vue'

defineOptions({ modalGroup: 'default' })

const props = defineProps<{
  passkeyId: string
  passkeyName: string
}>()

const { close, confirm } = useModalContext<boolean>()

const password = ref('')
const isSubmitting = ref(false)

async function submit() {
  isSubmitting.value = true
  try {
    await deletePasskey(props.passkeyId, password.value)
    confirm(true)
  } catch (error: unknown) {
    console.error('[settings] passkey removal failed', error)
    notify.error(describeRequestError(error, 'We couldn’t remove this passkey.'))
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card w-full max-w-md rounded-2xl border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <ModalTitle class="text-lg font-semibold">Remove passkey?</ModalTitle>
      <ModalDescription class="mt-1 text-sm leading-6 text-flixer-muted">
        “{{ passkeyName }}” will no longer work for signing in. Enter your password to confirm.
      </ModalDescription>

      <form class="mt-5 flex flex-col gap-5" @submit.prevent="submit">
        <TextInput v-model="password" label="Password" type="password" name="removePasskeyPassword" autocomplete="current-password" maxlength="128" required autofocus />

        <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" class="flex h-11 items-center justify-center rounded-lg border border-flixer-border px-6 text-sm font-semibold text-flixer-text transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" :disabled="isSubmitting" @click="close()">Cancel</button>
          <button type="submit" class="flex h-11 items-center justify-center rounded-lg bg-rose-500 px-6 text-sm font-semibold text-white shadow-lg shadow-rose-500/20 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300 disabled:cursor-wait disabled:opacity-60" :disabled="isSubmitting || !password">
            {{ isSubmitting ? 'Removing…' : 'Remove passkey' }}
          </button>
        </div>
      </form>
    </ModalContent>
  </ModalRoot>
</template>
