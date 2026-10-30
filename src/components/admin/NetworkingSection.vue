<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { applyStep, describeFailure, getProgress, type ConfigField } from '../../setup/setupApi'
import { notify } from '../../composables/notify'
import AdminSection from './AdminSection.vue'
import AdminSkeleton from './AdminSkeleton.vue'
import { catchError } from '../../utils/catchError'

const FIELDS = ['publicUrl', 'appUrl', 'passkeyRpId', 'passkeyOrigins'] as const
type Field = (typeof FIELDS)[number]

const { t } = useI18n()
const config = ref<Record<string, ConfigField>>({})
const form = reactive<Record<Field, string>>({ publicUrl: '', appUrl: '', passkeyRpId: '', passkeyOrigins: '' })
const errors = reactive<Record<string, string>>({})
const isLoading = ref(true)
const isSaving = ref(false)

const inputClass = 'mt-1 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 font-mono text-sm text-flixer-text disabled:opacity-60'
const button = 'rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-60'

const fields: { id: Field; label: string; hint: string; placeholder: string; wide?: boolean }[] = [
  { id: 'publicUrl', label: 'admin.general.publicAddress', hint: 'admin.general.publicAddressHint', placeholder: 'https://flixer.example.com/api' },
  { id: 'appUrl', label: 'admin.general.appAddress', hint: 'admin.general.appAddressHint', placeholder: 'https://flixer.example.com' },
  { id: 'passkeyRpId', label: 'admin.general.passkeyDomain', hint: 'admin.general.passkeyDomainHint', placeholder: 'flixer.example.com' },
  { id: 'passkeyOrigins', label: 'admin.general.passkeyOrigins', hint: 'admin.general.passkeyOriginsHint', placeholder: 'https://flixer.example.com', wide: true },
]

async function load() {
  try {
    const [error, progress] = await catchError(getProgress())
    if (error) {
      console.error('[networking] failed to load addresses', error)
      notify.error(describeFailure(error, t('admin.general.networkingLoadFailed')).message)
    } else {
      config.value = progress.config
      for (const field of FIELDS) form[field] = config.value[field]?.value ?? ''
    }
  } finally {
    isLoading.value = false
  }
}

async function save() {
  for (const key of Object.keys(errors)) delete errors[key]
  isSaving.value = true
  try {
    const [error] = await catchError(applyStep('urls', { ...form }))
    if (error) {
      const failure = describeFailure(error, t('admin.general.networkingSaveFailed'))
      Object.assign(errors, failure.fields)
      notify.error(failure.message)
    } else {
      notify.success(t('admin.general.networkingSaved'))
      await load()
    }
  } finally {
    isSaving.value = false
  }
}

onMounted(load)
</script>

<template>
  <AdminSection :title="t('admin.general.networkingTitle')" :description="t('admin.general.networkingDescription')">
    <template #actions>
      <button type="button" :class="button" :disabled="isLoading || isSaving" @click="save">{{ t('common.save') }}</button>
    </template>
    <AdminSkeleton v-if="isLoading" variant="fields" :rows="4" />
    <div v-else class="grid gap-4 md:grid-cols-2">
      <label v-for="field in fields" :key="field.id" class="text-xs text-flixer-muted" :class="{ 'md:col-span-2': field.wide }">
        {{ t(field.label) }}
        <input v-model.trim="form[field.id]" type="text" autocomplete="off" spellcheck="false" :placeholder="field.placeholder" :disabled="config[field.id]?.locked" :class="inputClass" />
        <span class="mt-1 block">{{ config[field.id]?.locked ? t('admin.connections.environment') : t(field.hint) }}</span>
        <span v-if="errors[field.id]" role="alert" class="mt-1 block text-red-300">{{ errors[field.id] }}</span>
      </label>
    </div>
  </AdminSection>
</template>
