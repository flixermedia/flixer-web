<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import TextInput from '../components/ui/TextInput.vue'
import SetupNotice from './SetupNotice.vue'

defineProps<{ message: string; title?: string; description?: string; hint?: string }>()
const emit = defineEmits<{ submit: [code: string] }>()

const { t } = useI18n()
const code = ref('')
const busy = ref(false)

async function send(): Promise<void> {
  if (!code.value.trim() || busy.value) return
  busy.value = true
  try {
    emit('submit', code.value)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <form class="flex w-full max-w-md flex-col gap-4" @submit.prevent="send">
    <h1 class="text-2xl font-semibold">{{ title ?? t('setup.recovery.title') }}</h1>
    <p class="text-sm text-flixer-muted">{{ description ?? t('setup.recovery.description') }}</p>
    <TextInput v-model.trim="code" :label="t('setup.recovery.code')" :hint="hint ?? t('setup.recovery.hint')" placeholder="ABCD-EFGH-JKMN-PQRS" autocomplete="off" spellcheck="false" autocapitalize="characters" />
    <SetupNotice v-if="message" kind="error">{{ message }}</SetupNotice>
    <button type="submit" class="h-11 rounded-lg bg-flixer-primary px-6 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60" :disabled="!code.trim() || busy">{{ t('setup.continue') }}</button>
  </form>
</template>
