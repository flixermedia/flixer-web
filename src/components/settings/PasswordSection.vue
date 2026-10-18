<script setup lang="ts">
import { ref } from 'vue'
import { changePassword } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import TextInput from '../ui/TextInput.vue'

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const isSaving = ref(false)

async function save() {
  if (newPassword.value !== confirmPassword.value) {
    notify.error('The new passwords don’t match.')
    return
  }
  isSaving.value = true
  try {
    await changePassword(currentPassword.value, newPassword.value)
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    notify.success('Password changed. Your other devices have been signed out.')
  } catch (error: unknown) {
    console.error('[settings] password change failed', error)
    notify.error(describeRequestError(error, 'We couldn’t     change your password.'))
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <section aria-labelledby="password-heading">
    <h2 id="password-heading" class="text-lg font-semibold">Change password</h2>
    <p class="mt-1 text-sm text-flixer-muted">Enter your current password to set a new one. Other devices will be signed out.</p>

    <form class="mt-6 flex flex-col gap-5" @submit.prevent="save">
      <TextInput v-model="currentPassword" label="Current password" type="password" name="currentPassword" autocomplete="current-password" maxlength="128" required />
      <TextInput v-model="newPassword" label="New password" type="password" name="newPassword" autocomplete="new-password" minlength="8" maxlength="128" required />
      <TextInput v-model="confirmPassword" label="Confirm new password" type="password" name="confirmPassword" autocomplete="new-password" minlength="8" maxlength="128" required />

      <button type="submit" class="flex h-12 w-fit items-center justify-center rounded-lg bg-gradient-to-r from-flixer-primary to-flixer-secondary px-8 text-sm font-semibold text-white shadow-lg shadow-flixer-primary/20 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-wait disabled:opacity-60" :disabled="isSaving">
        {{ isSaving ? 'Changing…' : 'Change password' }}
      </button>
    </form>
  </section>
</template>
