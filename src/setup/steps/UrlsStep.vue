<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import TextInput from '../../components/ui/TextInput.vue'
import SetupNotice from '../SetupNotice.vue'
import StepFrame from '../StepFrame.vue'
import { useStepForm } from '../useStepForm'

const { t } = useI18n()
const { wizard, busy, message, fieldErrors, save } = useStepForm('urls')
const config = wizard.progress.value.config
// Anything the environment sets wins over the store, so there is nothing to ask for.
const environmentLocked = computed(() => ['publicUrl', 'appUrl', 'passkeyRpId', 'passkeyOrigins'].some((name) => config[name]?.locked))
const publicUrl = ref(config.publicUrl?.value || window.location.origin)
const advanced = computed(() => wizard.flow.value === 'advanced')
const appUrl = ref(config.appUrl?.value ?? '')
const passkeyRpId = ref(config.passkeyRpId?.value ?? '')
const passkeyOrigins = ref(config.passkeyOrigins?.value ?? '')

async function submit(): Promise<boolean> {
  if (environmentLocked.value) return true
  const values: Record<string, string> = { publicUrl: publicUrl.value.trim() }
  if (advanced.value) Object.assign(values, { appUrl: appUrl.value.trim(), passkeyRpId: passkeyRpId.value.trim(), passkeyOrigins: passkeyOrigins.value.trim() })
  return (await save(values)) !== null
}

defineExpose({ submit })
</script>

<template>
  <StepFrame :title="t('setup.urls.title')" :description="t('setup.urls.description')">
    <SetupNotice v-if="environmentLocked" kind="info">{{ t('setup.lockedByEnvironment') }}</SetupNotice>
    <form v-else class="flex flex-col gap-4" @submit.prevent="wizard.advance()">
      <TextInput v-model.trim="publicUrl" :label="t('setup.urls.publicUrl')" :hint="fieldErrors.publicUrl || fieldErrors.passkeyOrigins || fieldErrors.passkeyRpId || t('setup.urls.hint')" placeholder="https://flixer.example.com" autocomplete="url" spellcheck="false" :disabled="busy" />
      <template v-if="advanced">
        <TextInput v-model.trim="appUrl" :label="t('setup.urls.appUrl')" :hint="fieldErrors.appUrl || t('setup.urls.appUrlHint')" autocomplete="off" spellcheck="false" :disabled="busy" />
        <TextInput v-model.trim="passkeyRpId" :label="t('setup.urls.passkeyRpId')" :hint="t('setup.urls.passkeyRpIdHint')" autocomplete="off" spellcheck="false" :disabled="busy" />
        <TextInput v-model.trim="passkeyOrigins" :label="t('setup.urls.passkeyOrigins')" :hint="t('setup.urls.passkeyOriginsHint')" autocomplete="off" spellcheck="false" :disabled="busy" />
      </template>
    </form>
    <SetupNotice v-if="message" kind="error">{{ message }}</SetupNotice>
  </StepFrame>
</template>
