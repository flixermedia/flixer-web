<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import TextInput from '../../components/ui/TextInput.vue'
import SetupNotice from '../SetupNotice.vue'
import StepFrame from '../StepFrame.vue'
import { fetchSetupGate } from '../setupApi'
import { markSetupComplete } from '../setupGate'
import { useStepForm } from '../useStepForm'

const { t } = useI18n()
const router = useRouter()
const { wizard, verified, busy, message, fieldErrors, testResult, test, save, locked } = useStepForm('database')
// Matches the bundled PostgreSQL service in docker-compose.yml.
const databaseUrl = ref('postgres://flixer:flixer@postgres:5432/flixer')
const environmentLocked = locked('databaseUrl')
const canContinue = computed(() => environmentLocked.value || verified.value)
watch(databaseUrl, () => (verified.value = false))
const waiting = ref(false)

async function submit(): Promise<boolean> {
  if (!environmentLocked.value) {
    const values = { databaseUrl: databaseUrl.value.trim() }
    // Never save a connection that has not been proven to work.
    if (!(await test(values)) || !(await save(values))) return false
  }
  waiting.value = true
  try {
    const ready = await wizard.waitUntilReady()
    if (!ready) {
      message.value = t('setup.database.notReady')
      return false
    }
    // A database that already has accounts is an existing installation: there is nothing left to set up.
    if ((await fetchSetupGate()).kind === 'ready') {
      markSetupComplete()
      await router.replace({ name: 'login' })
      return false
    }
    return true
  } finally {
    waiting.value = false
  }
}

defineExpose({ submit, canContinue })
</script>

<template>
  <StepFrame :title="t('setup.database.title')" :description="t('setup.database.description')">
    <SetupNotice v-if="environmentLocked" kind="info">{{ t('setup.lockedByEnvironment') }}</SetupNotice>
    <form v-else class="flex flex-col gap-4" @submit.prevent="wizard.advance()">
      <TextInput v-model.trim="databaseUrl" :label="t('setup.database.url')" :hint="fieldErrors.databaseUrl || t('setup.database.hint')" placeholder="postgres://user:password@host:5432/flixer" autocomplete="off" spellcheck="false" :disabled="busy" />
      <div>
        <button type="button" class="h-10 rounded-lg border border-flixer-border px-4 text-sm font-semibold transition hover:border-flixer-accent/60 disabled:opacity-60" :disabled="busy || !databaseUrl" @click="test({ databaseUrl })">{{ t('setup.testConnection') }}</button>
      </div>
    </form>
    <SetupNotice v-if="testResult" :kind="testResult.ok ? 'success' : 'error'">{{ testResult.ok ? t('setup.connectionOk') : testResult.message || t('setup.connectionFailed') }}</SetupNotice>
    <SetupNotice v-if="waiting" kind="info">{{ t('setup.database.starting') }}</SetupNotice>
    <SetupNotice v-if="message" kind="error">{{ message }}</SetupNotice>
  </StepFrame>
</template>
