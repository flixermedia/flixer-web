<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import TextInput from '../../components/ui/TextInput.vue'
import SetupNotice from '../SetupNotice.vue'
import StepFrame from '../StepFrame.vue'
import { useStepForm } from '../useStepForm'

const { t } = useI18n()
const { wizard, verified, busy, message, fieldErrors, testResult, test, save, locked } = useStepForm('services')
const config = wizard.progress.value.config
const indexerUrl = ref(config.indexerUrl?.value || 'http://localhost:8092')
const streamerInternalUrl = ref(config.streamerInternalUrl?.value || 'http://localhost:8091')
const streamerPublicUrl = ref(config.streamerPublicUrl?.value ?? '')
const lockedNames = ['indexerUrl', 'streamerInternalUrl', 'streamerPublicUrl'].map((name) => locked(name))
const environmentLocked = computed(() => lockedNames.some((flag) => flag.value))
const canContinue = computed(() => environmentLocked.value || verified.value)
watch([indexerUrl, streamerInternalUrl, streamerPublicUrl], () => (verified.value = false))

function values() {
  return { indexerUrl: indexerUrl.value.trim(), streamerInternalUrl: streamerInternalUrl.value.trim(), streamerPublicUrl: streamerPublicUrl.value.trim() }
}

async function submit(): Promise<boolean> {
  if (environmentLocked.value) return true
  if (!(await test(values()))) return false
  return (await save(values())) !== null
}

defineExpose({ submit, canContinue })
</script>

<template>
  <StepFrame :title="t('setup.services.title')" :description="t('setup.services.description')">
    <SetupNotice v-if="environmentLocked" kind="info">{{ t('setup.lockedByEnvironment') }}</SetupNotice>
    <form v-else class="flex flex-col gap-4" @submit.prevent="wizard.advance()">
      <TextInput v-model.trim="indexerUrl" :label="t('setup.services.indexerUrl')" :hint="fieldErrors.indexerUrl" placeholder="http://indexer:8092" autocomplete="off" spellcheck="false" :disabled="busy" />
      <TextInput v-model.trim="streamerInternalUrl" :label="t('setup.services.streamerInternalUrl')" :hint="fieldErrors.streamerInternalUrl" placeholder="http://streamer:8091" autocomplete="off" spellcheck="false" :disabled="busy" />
      <TextInput v-model.trim="streamerPublicUrl" :label="t('setup.services.streamerPublicUrl')" :hint="fieldErrors.streamerPublicUrl || t('setup.services.streamerPublicHint')" placeholder="https://stream.example.com" autocomplete="off" spellcheck="false" :disabled="busy" />
      <div>
        <button type="button" class="h-10 rounded-lg border border-flixer-border px-4 text-sm font-semibold transition hover:border-flixer-accent/60 disabled:opacity-60" :disabled="busy || !indexerUrl || !streamerInternalUrl" @click="test(values())">{{ t('setup.testConnection') }}</button>
      </div>
    </form>
    <SetupNotice v-if="testResult" :kind="testResult.ok ? 'success' : 'error'">{{ testResult.ok ? t('setup.connectionOk') : testResult.message || t('setup.connectionFailed') }}</SetupNotice>
    <SetupNotice v-if="message" kind="error">{{ message }}</SetupNotice>
  </StepFrame>
</template>
