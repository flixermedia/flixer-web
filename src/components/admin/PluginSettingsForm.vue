<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getPluginSettings, updatePluginSettings, type PluginSettingsSchema } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import AdminSection from './AdminSection.vue'

const props = defineProps<{ pluginId: string; title: string; description?: string; closable?: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
const schema = ref<PluginSettingsSchema | null>(null)
const values = ref<Record<string, unknown>>({})
const arrayText = ref<Record<string, string>>({})
const loading = ref(true)
const saving = ref(false)
const error = ref('')

const inputClass = 'w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm outline-none focus:border-flixer-accent'
const buttonClass = 'rounded bg-flixer-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-60'
const quietButtonClass = 'rounded border border-flixer-border px-3 py-2 text-sm font-semibold transition hover:bg-white/5 disabled:opacity-60'

const isSecret = (property: { writeOnly?: boolean; 'x-flixer-secret'?: boolean }) => property.writeOnly === true || property['x-flixer-secret'] === true

function apply(result: Awaited<ReturnType<typeof getPluginSettings>>) {
  schema.value = result.schema
  values.value = { ...result.values }
  arrayText.value = {}
  for (const [name, property] of Object.entries(result.schema?.properties ?? {})) {
    if (!(name in values.value) && property.default !== undefined) values.value[name] = property.default
    if (property.type === 'array') {
      const value = values.value[name]
      arrayText.value[name] = Array.isArray(value) ? value.join(', ') : ''
    }
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [requestError, result] = await catchError(getPluginSettings(props.pluginId))
    if (requestError) {
      error.value = describeRequestError(requestError)
    } else {
      apply(result)
    }
  } finally {
    loading.value = false
  }
}

async function save() {
  if (!schema.value) return
  const nextValues: Record<string, unknown> = {}
  const secrets: Record<string, string> = {}
  for (const [name, property] of Object.entries(schema.value.properties)) {
    const value = values.value[name]
    if (isSecret(property)) secrets[name] = typeof value === 'string' ? value : ''
    else if (property.type === 'array') {
      const items = (arrayText.value[name] ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
      nextValues[name] = property.items?.type === 'string' ? items : items.map(Number)
    } else if (property.type === 'integer' || property.type === 'number') nextValues[name] = value === '' ? undefined : Number(value)
    else nextValues[name] = value
  }

  saving.value = true
  try {
    const [error, result] = await catchError(updatePluginSettings(props.pluginId, { values: nextValues, secrets }))
    if (error) {
      notify.error(describeRequestError(error))
    } else {
      apply(result)
      notify.success(t('admin.plugins.settingsSaved'))
    }
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <AdminSection :title="title" :description="description">
    <p v-if="error" role="alert" class="text-sm text-red-300">{{ error }}</p>
    <p v-else-if="loading" class="text-sm text-flixer-muted">{{ t('common.loading') }}</p>
    <form v-else-if="schema" class="grid gap-4 md:grid-cols-2" @submit.prevent="save">
      <label v-for="(property, name) in schema.properties" :key="name" class="grid content-start gap-1 text-sm">
        <span>{{ property.title || name }}</span>
        <span v-if="property.description" class="text-xs text-flixer-muted">{{ property.description }}</span>
        <select v-if="property.enum" v-model="values[name]" :class="inputClass">
          <option v-for="option in property.enum" :key="String(option)" :value="option">{{ option }}</option>
        </select>
        <input v-else-if="property.type === 'boolean'" v-model="values[name]" type="checkbox" class="h-4 w-4 accent-flixer-accent" />
        <textarea v-else-if="property.type === 'array'" v-model="arrayText[name]" :class="inputClass" rows="2" :placeholder="t('admin.plugins.listPlaceholder')" />
        <input v-else v-model="values[name]" :class="inputClass" :type="isSecret(property) ? 'password' : property.type === 'integer' || property.type === 'number' ? 'number' : property.format === 'uri' ? 'url' : 'text'" :autocomplete="isSecret(property) ? 'new-password' : 'off'" />
      </label>
      <div class="flex items-center gap-2 md:col-span-2">
        <button :class="buttonClass" type="submit" :disabled="saving">{{ saving ? t('admin.plugins.savingSettings') : t('admin.plugins.saveSettings') }}</button>
        <button v-if="closable" :class="quietButtonClass" type="button" @click="emit('close')">{{ t('common.cancel') }}</button>
      </div>
    </form>
  </AdminSection>
</template>
