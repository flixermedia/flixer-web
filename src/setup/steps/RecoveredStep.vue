<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import StepFrame from '../StepFrame.vue'
import { clearRecoveryCode } from '../setupApi'
import { markSetupComplete } from '../setupGate'

const { t } = useI18n()
const router = useRouter()

async function submit(): Promise<boolean> {
  clearRecoveryCode()
  markSetupComplete()
  await router.replace({ name: 'login' })
  return false
}

defineExpose({ submit })
</script>

<template>
  <StepFrame :title="t('setup.recovered.title')" :description="t('setup.recovered.description')" />
</template>
