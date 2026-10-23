<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getAccessToken, register, saveAccessToken } from '../../api'
import TextInput from '../../components/ui/TextInput.vue'
import SetupNotice from '../SetupNotice.vue'
import StepFrame from '../StepFrame.vue'
import { useStepForm } from '../useStepForm'

const { t } = useI18n()
const { wizard, busy, message, save, run } = useStepForm('admin')
const exists = wizard.progress.value.adminExists && getAccessToken() !== null
const username = ref('')
const displayName = ref('')
const email = ref('')
const password = ref('')
const confirm = ref('')

async function submit(): Promise<boolean> {
  if (exists) return (await save({})) !== null
  if (password.value !== confirm.value) {
    message.value = t('setup.admin.mismatch')
    return false
  }
  const created = await run(() => register(username.value.trim(), password.value, email.value.trim(), displayName.value.trim() || undefined))
  if (!created) return false
  if (!('accessToken' in created)) {
    message.value = t('setup.admin.verification')
    return false
  }
  saveAccessToken(created.accessToken)
  return (await save({})) !== null
}

defineExpose({ submit })
</script>

<template>
  <StepFrame :title="t('setup.admin.title')" :description="t('setup.admin.description')">
    <SetupNotice v-if="exists" kind="success">{{ t('setup.admin.exists') }}</SetupNotice>
    <form v-else class="flex flex-col gap-4" @submit.prevent="wizard.advance()">
      <TextInput v-model.trim="username" :label="t('auth.username')" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="64" :disabled="busy" />
      <TextInput v-model="displayName" :label="t('auth.displayName')" autocomplete="nickname" maxlength="64" :disabled="busy" />
      <TextInput v-model.trim="email" type="email" :label="t('auth.email')" autocomplete="email" maxlength="254" :disabled="busy" />
      <TextInput v-model="password" type="password" :label="t('auth.password')" :hint="t('auth.passwordGuidance')" autocomplete="new-password" minlength="8" maxlength="128" :disabled="busy" />
      <TextInput v-model="confirm" type="password" :label="t('setup.admin.confirm')" autocomplete="new-password" maxlength="128" :disabled="busy" />
    </form>
    <SetupNotice v-if="message" kind="error">{{ message }}</SetupNotice>
  </StepFrame>
</template>
