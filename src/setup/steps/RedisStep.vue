<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import TextInput from '../../components/ui/TextInput.vue'
import SetupNotice from '../SetupNotice.vue'
import StepFrame from '../StepFrame.vue'
import { useStepForm } from '../useStepForm'

const { t } = useI18n()
const { wizard, verified, busy, message, fieldErrors, testResult, test, save, locked } = useStepForm('redis')
const redisUrl = ref('redis://redis:6379')
const environmentLocked = locked('redisUrl')
const canContinue = computed(() => environmentLocked.value || verified.value)
watch(redisUrl, () => (verified.value = false))
const restart = ref<string[]>([])

async function submit(): Promise<boolean> {
  if (environmentLocked.value) return true
  const values = { redisUrl: redisUrl.value.trim() }
  if (!(await test(values))) return false
  const result = await save(values)
  restart.value = result?.restart ?? []
  return result !== null
}

defineExpose({ submit, canContinue })
</script>

<template>
  <StepFrame :title="t('setup.redis.title')" :description="t('setup.redis.description')">
    <SetupNotice v-if="environmentLocked" kind="info">{{ t('setup.lockedByEnvironment') }}</SetupNotice>
    <form v-else class="flex flex-col gap-4" @submit.prevent="wizard.advance()">
      <TextInput v-model.trim="redisUrl" :label="t('setup.redis.url')" :hint="fieldErrors.redisUrl || t('setup.redis.hint')" placeholder="redis://redis:6379" autocomplete="off" spellcheck="false" :disabled="busy" />
      <div>
        <button type="button" class="h-10 rounded-lg border border-flixer-border px-4 text-sm font-semibold transition hover:border-flixer-accent/60 disabled:opacity-60" :disabled="busy || !redisUrl" @click="test({ redisUrl })">{{ t('setup.testConnection') }}</button>
      </div>
    </form>
    <SetupNotice v-if="testResult" :kind="testResult.ok ? 'success' : 'error'">{{ testResult.ok ? t('setup.connectionOk') : testResult.message || t('setup.connectionFailed') }}</SetupNotice>
    <SetupNotice v-if="restart.length" kind="info">{{ t('setup.restartNeeded', { services: restart.join(', ') }) }}</SetupNotice>
    <SetupNotice v-if="message" kind="error">{{ message }}</SetupNotice>
  </StepFrame>
</template>
