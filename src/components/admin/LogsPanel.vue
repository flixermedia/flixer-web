<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { logs } from './mock'
import AdminSection from './AdminSection.vue'
import StatusPill from './StatusPill.vue'

const { t } = useI18n()
const level = ref<'All' | 'Info' | 'Warn' | 'Error'>('All')
const levelKeys = { All: 'admin.logs.all', Info: 'admin.logs.info', Warn: 'admin.logs.warn', Error: 'admin.logs.error' }
const visible = computed(() => logs.filter((l) => level.value === 'All' || l.level === level.value))
const tone = { Info: 'neutral', Warn: 'warn', Error: 'bad' } as const
</script>

<template>
  <AdminSection :title="t('admin.logs.title')" :description="t('admin.logs.description')">
    <template #actions>
      <select v-model="level" :aria-label="t('admin.logs.logLevel')" class="rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm">
        <option value="All">{{ t(levelKeys.All) }}</option>
        <option value="Info">{{ t(levelKeys.Info) }}</option>
        <option value="Warn">{{ t(levelKeys.Warn) }}</option>
        <option value="Error">{{ t(levelKeys.Error) }}</option>
      </select>
      <button type="button" class="rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15">{{ t('admin.logs.download') }}</button>
    </template>
    <ul class="divide-y divide-flixer-border font-mono text-xs">
      <li v-for="(l, i) in visible" :key="i" class="flex flex-wrap items-center gap-3 py-2">
        <span class="text-flixer-muted">{{ l.time }}</span>
        <StatusPill :tone="tone[l.level]">{{ t(levelKeys[l.level]) }}</StatusPill>
        <span class="text-flixer-cyan">{{ l.source }}</span>
        <span class="min-w-0 flex-1 break-words">{{ l.message }}</span>
      </li>
      <li v-if="visible.length === 0" class="py-6 text-center text-flixer-muted">{{ t('admin.logs.empty') }}</li>
    </ul>
  </AdminSection>
</template>
