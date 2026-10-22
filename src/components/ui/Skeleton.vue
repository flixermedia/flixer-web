<script setup lang="ts">
import { useI18n } from 'vue-i18n'

/** Placeholder block shown while content loads. Size and shape come from the classes passed in. */
withDefaults(defineProps<{ label?: boolean }>(), { label: false })
const { t } = useI18n()
</script>

<template>
  <div class="animate-pulse rounded bg-white/10 motion-reduce:animate-none" :role="label ? 'status' : undefined" :aria-label="label ? t('common.loading') : undefined" :aria-hidden="label ? undefined : true"></div>
</template>
