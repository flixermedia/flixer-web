<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { themeAttributes, themeVariableMap } from '../../composables/themeCss'
import type { ThemeConfig } from '../../api'

const props = withDefaults(defineProps<{ config: ThemeConfig; mode: 'dark' | 'light'; compact?: boolean }>(), { compact: false })
const { t } = useI18n()

const styleVariables = computed(() => themeVariableMap(props.config, props.mode))
const attributes = computed(() => themeAttributes(props.config))
const appName = computed(() => props.config.branding.appName || 'Flixer')
const logo = computed(() => (props.mode === 'light' && props.config.branding.logoLight) || props.config.branding.logo)
const floating = computed(() => props.config.header.style === 'floating')
</script>

<template>
  <div v-bind="attributes" class="theme-preview overflow-hidden rounded border border-flixer-border bg-flixer-background text-flixer-text" :class="compact ? 'text-[9px]' : 'text-xs'" :style="styleVariables" aria-hidden="true">
    <div class="flex items-center gap-2 border-b border-flixer-border px-3" :class="[compact ? 'h-6' : 'h-9', floating ? 'm-1.5 rounded border bg-flixer-surface' : 'bg-flixer-surface', props.config.header.navAlign === 'center' ? 'justify-center' : '']">
      <img v-if="logo" :src="logo" alt="" class="h-4 w-auto max-w-16 object-contain" />
      <span v-if="!logo || config.header.showName" class="font-bold text-flixer-primary">{{ appName }}</span>
      <span class="text-flixer-muted">{{ t('admin.appearance.preview.home') }}</span>
      <span class="text-flixer-muted">{{ t('admin.appearance.preview.movies') }}</span>
    </div>
    <div class="grid gap-2 p-3">
      <div class="flex gap-2">
        <div v-for="n in 3" :key="n" class="admin-card h-12 flex-1 p-2" :class="compact && 'h-8'">
          <div class="h-1.5 w-2/3 rounded bg-flixer-muted/40"></div>
          <div class="mt-1 h-1.5 w-1/3 rounded bg-flixer-accent/60"></div>
        </div>
      </div>
      <div v-if="!compact" class="admin-card grid gap-2 p-3">
        <p class="font-semibold">{{ t('admin.appearance.preview.sample') }}</p>
        <p class="text-flixer-muted">{{ t('admin.appearance.preview.sampleBody') }}</p>
        <div class="flex flex-wrap gap-2">
          <button type="button" tabindex="-1" class="rounded bg-flixer-primary px-3 py-1 font-semibold text-white">{{ t('admin.appearance.preview.primary') }}</button>
          <button type="button" tabindex="-1" class="rounded border border-flixer-border px-3 py-1 font-semibold">{{ t('admin.appearance.preview.secondary') }}</button>
          <span class="rounded-full bg-flixer-accent/20 px-2 py-1 text-flixer-accent">{{ t('admin.appearance.preview.badge') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
