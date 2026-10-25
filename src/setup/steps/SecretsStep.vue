<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import SetupNotice from '../SetupNotice.vue'
import StepFrame from '../StepFrame.vue'
import { useStepForm } from '../useStepForm'

const { t } = useI18n()
const { wizard, busy, message, save } = useStepForm('secrets')
const config = wizard.progress.value.config
const regenerate = ref<Record<string, boolean>>({ jwtSecret: false, appSecret: false })
const restart = ref<string[]>([])
const notice = ref('')
const secrets = ['jwtSecret', 'appSecret'] as const
const allLocked = computed(() => secrets.every((name) => config[name]?.locked))

async function submit(): Promise<boolean> {
  const generate = secrets.filter((name) => regenerate.value[name] && !config[name]?.locked)
  // The server creates both secrets on first start, so leaving everything untouched is a valid choice.
  if (generate.length === 0) return true
  const result = await save({ generate })
  if (result) regenerate.value = { jwtSecret: false, appSecret: false }
  restart.value = result?.restart ?? []
  notice.value = result?.message ?? ''
  return result !== null && restart.value.length === 0
}

defineExpose({ submit })
</script>

<template>
  <StepFrame :title="t('setup.secrets.title')" :description="t('setup.secrets.description')">
    <SetupNotice v-if="allLocked" kind="info">{{ t('setup.lockedByEnvironment') }}</SetupNotice>
    <ul v-else class="flex flex-col gap-2" :aria-busy="busy">
      <li v-for="name in secrets" :key="name" class="flex items-start justify-between gap-4 rounded-lg border border-flixer-border bg-flixer-surface/60 px-4 py-3 text-sm">
        <div class="min-w-0">
          <p class="font-semibold">{{ t(`setup.secrets.${name}`) }}</p>
          <p class="text-xs text-flixer-muted">{{ config[name]?.locked ? t('setup.secrets.fromEnvironment') : config[name]?.set ? t('setup.secrets.generated') : t('setup.secrets.pending') }}</p>
        </div>
        <label v-if="!config[name]?.locked" class="flex shrink-0 items-center gap-2 text-xs text-flixer-muted">
          <input v-model="regenerate[name]" type="checkbox" :disabled="busy" />
          {{ t('setup.secrets.regenerate') }}
        </label>
      </li>
    </ul>
    <SetupNotice v-if="notice" kind="info">{{ notice }}</SetupNotice>
    <SetupNotice v-if="restart.length" kind="info">{{ t('setup.restartNeeded', { services: restart.join(', ') }) }}</SetupNotice>
    <SetupNotice v-if="message" kind="error">{{ message }}</SetupNotice>
  </StepFrame>
</template>
