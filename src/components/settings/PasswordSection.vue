<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { changePassword } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import TextInput from '../ui/TextInput.vue'

const { t } = useI18n()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const isSaving = ref(false)

async function save() {
  if (newPassword.value !== confirmPassword.value) {
    notify.error(t('settings.password.passwordsMismatch'))
    return
  }
  isSaving.value = true
  try {
    const [error] = await catchError(changePassword(currentPassword.value, newPassword.value))
    if (error) {
      console.error('[settings] password change failed', error)
      notify.error(describeRequestError(error, t('settings.password.changeFailed')))
    } else {
      currentPassword.value = ''
      newPassword.value = ''
      confirmPassword.value = ''
      notify.success(t('settings.password.changed'))
    }
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <section aria-labelledby="password-heading">
    <h2 id="password-heading" class="text-lg font-semibold">{{ t('settings.password.title') }}</h2>
    <p class="mt-1 text-sm text-flixer-muted">{{ t('settings.password.description') }}</p>

    <form class="mt-6 flex flex-col gap-5" @submit.prevent="save">
      <TextInput v-model="currentPassword" :label="t('settings.password.currentPassword')" type="password" name="currentPassword" autocomplete="current-password" maxlength="128" required />
      <TextInput v-model="newPassword" :label="t('settings.password.newPassword')" type="password" name="newPassword" autocomplete="new-password" minlength="8" maxlength="128" required />
      <TextInput v-model="confirmPassword" :label="t('settings.password.confirmPassword')" type="password" name="confirmPassword" autocomplete="new-password" minlength="8" maxlength="128" required />

      <button type="submit" class="flex h-12 w-fit items-center justify-center rounded-lg bg-gradient-to-r from-flixer-primary to-flixer-secondary px-8 text-sm font-semibold text-white shadow-lg shadow-flixer-primary/20 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-wait disabled:opacity-60" :disabled="isSaving">
        {{ isSaving ? t('settings.password.changing') : t('settings.password.title') }}
      </button>
    </form>
  </section>
</template>
