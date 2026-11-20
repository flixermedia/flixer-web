<script setup lang="ts">
import { Radio, RadioGroup } from '@ui-sdk/vue/radio'
import { inject, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import SetupNotice from '../SetupNotice.vue'
import StepFrame from '../StepFrame.vue'
import { AVAILABLE_FLOWS } from '../registry'
import { describeFailure, setFlow, type SetupFlow } from '../setupApi'
import { WIZARD_KEY } from '../stepContract'
import { catchError } from '../../utils/catchError'

const { t } = useI18n()
const wizard = inject(WIZARD_KEY)!
const selected = ref<SetupFlow>(wizard.flow.value !== 'recovery' && AVAILABLE_FLOWS.includes(wizard.flow.value) ? wizard.flow.value : 'quick')
const message = ref('')

const options: { flow: SetupFlow; available: boolean }[] = [
  { flow: 'quick', available: AVAILABLE_FLOWS.includes('quick') },
  { flow: 'advanced', available: AVAILABLE_FLOWS.includes('advanced') },
]

async function submit(): Promise<boolean> {
  message.value = ''
  const [flowError] = await catchError(setFlow(selected.value))
  if (flowError) {
    message.value = describeFailure(flowError, t('setup.errors.generic')).message
    return false
  }
  wizard.chooseFlow(selected.value)
  const [refreshError] = await catchError(wizard.refresh())
  if (refreshError) {
    message.value = describeFailure(refreshError, t('setup.errors.generic')).message
    return false
  }
  return true
}

defineExpose({ submit })
</script>

<template>
  <StepFrame :title="t('setup.welcome.title')" :description="t('setup.welcome.description')">
    <RadioGroup data-agent-hidden :value="selected" class="grid gap-3" :aria-label="t('setup.welcome.choose')" @update:value="(value) => { if (value === 'quick' || value === 'advanced') selected = value }">
      <Radio v-for="option in options" :key="option.flow" :value="option.flow" :disabled="!option.available" class="block h-auto w-full rounded border border-flixer-border bg-flixer-surface/60 p-5 text-left font-normal text-flixer-text transition hover:border-flixer-accent/50 data-checked:border-flixer-accent data-checked:bg-flixer-primary/10 data-checked:ring-4 data-checked:ring-flixer-primary/20 disabled:cursor-not-allowed disabled:opacity-50">
        <span class="flex items-center justify-between gap-3">
          <span class="text-base font-semibold">{{ t(`setup.welcome.${option.flow}.title`) }}</span>
          <span v-if="!option.available" class="rounded-full border border-flixer-border px-2 py-0.5 text-[10px] font-semibold text-flixer-muted">{{ t('setup.welcome.soon') }}</span>
        </span>
        <span class="mt-1 block text-sm leading-6 text-flixer-muted">{{ t(`setup.welcome.${option.flow}.description`) }}</span>
      </Radio>
    </RadioGroup>
    <SetupNotice v-if="message" kind="error">{{ message }}</SetupNotice>
  </StepFrame>
</template>
