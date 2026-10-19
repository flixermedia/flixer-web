<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

export interface SettingsTab {
  id: string
  label: string
  url?: string
}

withDefaults(
  defineProps<{
    tabs: SettingsTab[]
    modelValue: string
    background?: boolean
  }>(),
  { background: true },
)

const emit = defineEmits<{ 'update:modelValue': [id: string] }>()
const { t } = useI18n()

const baseClass = 'shrink-0 rounded-md px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent'
const idleClass = 'text-flixer-text/70 hover:text-white'

function isExternal(url: string): boolean {
  return /^[a-z][a-z\d+.-]*:/i.test(url) || url.startsWith('//')
}
</script>

<template>
  <div class="flex gap-1 overflow-x-auto rounded-lg p-1" :class="background && 'bg-white/5'" role="tablist" :aria-label="t('settings.tabs.ariaLabel')">
    <template v-for="tab in tabs" :key="tab.id">
      <a v-if="tab.url && isExternal(tab.url)" :href="tab.url" :class="[baseClass, idleClass]">{{ tab.label }}</a>
      <RouterLink v-else-if="tab.url" :to="tab.url" :class="[baseClass, idleClass]">{{ tab.label }}</RouterLink>
      <button v-else type="button" role="tab" :aria-selected="tab.id === modelValue" :class="[baseClass, tab.id === modelValue ? 'bg-white/15 text-white' : idleClass]" @click="emit('update:modelValue', tab.id)">
        {{ tab.label }}
      </button>
    </template>
  </div>
</template>
