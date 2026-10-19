<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import TextInput from '../ui/TextInput.vue'

defineProps<{
  isRegistering: boolean
}>()

const emit = defineEmits<{
  add: [name: string]
}>()

const { t } = useI18n()
const name = ref('')

function handleSubmit() {
  emit('add', name.value)
  name.value = ''
}
</script>

<template>
  <form class="flex flex-col gap-3 sm:flex-row sm:items-start" @submit.prevent="handleSubmit">
    <TextInput v-model.trim="name" class="flex-1" type="text" maxlength="64" :aria-label="t('settings.passkeys.nameLabel')" :placeholder="t('settings.passkeys.namePlaceholder')" />
    <button type="submit" class="flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-flixer-primary to-flixer-secondary px-6 text-sm font-semibold text-white shadow-lg shadow-flixer-primary/20 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-wait disabled:opacity-60" :disabled="isRegistering">
      <span v-if="isRegistering" class="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true"></span>
      {{ isRegistering ? t('settings.passkeys.waitingForDevice') : t('settings.passkeys.add') }}
    </button>
  </form>
</template>
