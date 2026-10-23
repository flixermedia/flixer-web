<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import SetupNotice from '../SetupNotice.vue'
import StepFrame from '../StepFrame.vue'
import { markSetupComplete } from '../setupGate'
import { clearRecoveryCode, completeSetup } from '../setupApi'
import { useStepForm } from '../useStepForm'

const { t } = useI18n()
const router = useRouter()
const { wizard, busy, message, run } = useStepForm('finish')

const summary = computed(() => {
  const config = wizard.progress.value.config
  return [
    { label: t('setup.steps.database'), ok: config.databaseUrl?.set === true },
    { label: t('setup.steps.admin'), ok: wizard.progress.value.adminExists },
    { label: t('setup.steps.urls'), ok: config.publicUrl?.set === true },
    { label: t('setup.steps.redis'), ok: config.redisUrl?.set === true },
    ...(wizard.flow.value === 'advanced'
      ? [
          { label: t('setup.steps.services'), ok: config.indexerUrl?.set === true && config.streamerInternalUrl?.set === true },
          { label: t('setup.steps.secrets'), ok: config.jwtSecret?.set === true && config.streamTokenSecret?.set === true },
        ]
      : []),
  ]
})

async function submit(): Promise<boolean> {
  const done = await run(async () => {
    await completeSetup()
    return true
  })
  if (!done) return false
  clearRecoveryCode()
  markSetupComplete()
  await router.replace({ name: 'home' })
  return false
}

defineExpose({ submit })
</script>

<template>
  <StepFrame :title="t('setup.finish_.title')" :description="t('setup.finish_.description')">
    <ul class="flex flex-col gap-2" :aria-busy="busy">
      <li v-for="item in summary" :key="item.label" class="flex items-center justify-between rounded-lg border border-flixer-border bg-flixer-surface/60 px-4 py-3 text-sm">
        <span>{{ item.label }}</span>
        <span :class="item.ok ? 'text-emerald-300' : 'text-amber-300'">{{ item.ok ? t('setup.finish_.configured') : t('setup.finish_.missing') }}</span>
      </li>
    </ul>
    <SetupNotice v-if="message" kind="error">{{ message }}</SetupNotice>
  </StepFrame>
</template>
