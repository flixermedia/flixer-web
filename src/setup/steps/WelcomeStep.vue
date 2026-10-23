<script setup lang="ts">
import { inject, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import SetupNotice from '../SetupNotice.vue'
import StepFrame from '../StepFrame.vue'
import { AVAILABLE_FLOWS } from '../registry'
import { describeFailure, setFlow, type SetupFlow } from '../setupApi'
import { WIZARD_KEY } from '../stepContract'

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
  try {
    await setFlow(selected.value)
    wizard.chooseFlow(selected.value)
    await wizard.refresh()
    return true
  } catch (error: unknown) {
    message.value = describeFailure(error, t('setup.errors.generic')).message
    return false
  }
}

defineExpose({ submit })
</script>

<template>
  <StepFrame :title="t('setup.welcome.title')" :description="t('setup.welcome.description')">
    <div class="grid gap-3" role="radiogroup" :aria-label="t('setup.welcome.choose')">
      <button v-for="option in options" :key="option.flow" type="button" role="radio" :aria-checked="selected === option.flow" :disabled="!option.available" class="rounded-xl border p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-50" :class="selected === option.flow ? 'border-flixer-accent bg-flixer-primary/10 ring-4 ring-flixer-primary/20' : 'border-flixer-border bg-flixer-surface/60 hover:border-flixer-accent/50'" @click="selected = option.flow">
        <span class="flex items-center justify-between gap-3">
          <span class="text-base font-semibold">{{ t(`setup.welcome.${option.flow}.title`) }}</span>
          <span v-if="!option.available" class="rounded-full border border-flixer-border px-2 py-0.5 text-[10px] font-semibold text-flixer-muted">{{ t('setup.welcome.soon') }}</span>
        </span>
        <span class="mt-1 block text-sm leading-6 text-flixer-muted">{{ t(`setup.welcome.${option.flow}.description`) }}</span>
      </button>
    </div>
    <SetupNotice v-if="message" kind="error">{{ message }}</SetupNotice>
  </StepFrame>
</template>
