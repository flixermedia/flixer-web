<script setup lang="ts">
import type { Passkey } from '../../api'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{
  passkeys: Passkey[]
  deletingId: string | null
}>()

const emit = defineEmits<{
  remove: [passkey: Passkey]
}>()

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleString() : t('settings.passkeys.never')
}
</script>

<template>
  <ul v-if="passkeys.length" class="flex flex-col gap-3">
    <li v-for="passkey in passkeys" :key="passkey.id" class="flex items-center gap-4 rounded-lg border border-flixer-border bg-flixer-surface/50 p-4">
      <span class="grid size-10 shrink-0 place-items-center rounded-lg border border-flixer-accent/20 bg-flixer-primary/10 text-flixer-accent" aria-hidden="true">
        <Icon icon="lucide:key-round" class="size-5" aria-hidden="true" />
      </span>
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-semibold text-flixer-text">{{ passkey.name }}</p>
        <p class="mt-0.5 text-xs text-flixer-muted">
          {{ passkey.deviceType === 'multiDevice' ? t('settings.passkeys.synced') : t('settings.passkeys.deviceBound') }}
          <template v-if="passkey.transports.length"> · {{ passkey.transports.join(', ') }}</template>
        </p>
        <p class="mt-0.5 text-xs text-flixer-muted/80">{{ t('settings.passkeys.dateDetails', { added: formatDate(passkey.createdAt), lastUsed: formatDate(passkey.lastUsedAt) }) }}</p>
      </div>
      <button type="button" class="rounded-lg border border-flixer-border px-3 py-2 text-xs font-semibold text-rose-300 transition hover:border-rose-300/40 hover:bg-rose-300/10 disabled:cursor-wait disabled:opacity-60" :disabled="deletingId === passkey.id" @click="emit('remove', passkey)">
        {{ deletingId === passkey.id ? t('settings.passkeys.removing') : t('settings.passkeys.remove') }}
      </button>
    </li>
  </ul>
  <p v-else class="rounded-lg border border-dashed border-flixer-border p-6 text-center text-sm text-flixer-muted">{{ t('settings.passkeys.empty') }}</p>
</template>
