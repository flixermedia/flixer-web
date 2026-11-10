<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { listMediaLibraries, saveAppearanceSettings, type AppearanceState, type MediaLibrary } from '../../api'
import { notify } from '../../composables/notify'
import { contrastRatio } from '../../composables/themeCss'
import { refreshAppearance } from '../../composables/useAppearance'
import { describeRequestError } from '../../composables/useProfile'
import AdminSection from './AdminSection.vue'

const props = defineProps<{ state: AppearanceState }>()
const emit = defineEmits<{ saved: [state: AppearanceState] }>()
const { t } = useI18n()

const libraries = ref<MediaLibrary[]>([])
const colors = ref<Record<string, string>>({})
const saving = ref(false)
const dirty = computed(() => JSON.stringify(sorted(colors.value)) !== JSON.stringify(sorted(props.state.libraryAccents)))

function sorted(value: Record<string, string>) {
  return Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
}

watch(() => props.state.libraryAccents, (accents) => (colors.value = { ...accents }), { immediate: true })
onMounted(async () => {
  libraries.value = await listMediaLibraries().catch(() => [])
})

function set(id: string, value: string) {
  colors.value = { ...colors.value, [id]: value }
}

function clear(id: string) {
  const { [id]: _removed, ...rest } = colors.value
  colors.value = rest
}

async function save() {
  if (saving.value) return
  saving.value = true
  try {
    const next = await saveAppearanceSettings({ libraryAccents: colors.value })
    notify.success(t('admin.appearance.libraryAccents.saved'))
    emit('saved', next)
    await refreshAppearance()
  } catch (error) {
    notify.error(describeRequestError(error, t('admin.appearance.libraryAccents.saveError')))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <AdminSection v-if="libraries.length" :title="t('admin.appearance.libraryAccents.title')" :description="t('admin.appearance.libraryAccents.description')">
    <template #actions>
      <button type="button" :disabled="!dirty || saving" class="rounded bg-flixer-primary px-3 py-2 text-sm font-semibold text-white hover:bg-flixer-primary/80 disabled:cursor-not-allowed disabled:opacity-50" @click="save">{{ saving ? t('admin.appearance.saving') : t('admin.appearance.libraryAccents.save') }}</button>
    </template>
    <ul class="grid gap-2 sm:grid-cols-2">
      <li v-for="library in libraries" :key="library.id" class="flex items-center gap-3 rounded border border-flixer-border bg-flixer-background/30 p-2">
        <input type="color" :value="colors[library.id] ?? '#7645d7'" class="size-9 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0" :aria-label="library.name" @input="set(library.id, ($event.target as HTMLInputElement).value)" />
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium">{{ library.name }}</p>
          <p v-if="colors[library.id] && contrastRatio(colors[library.id], '#ffffff') < 3" class="flex items-center gap-1 text-[11px] text-amber-400"><Icon icon="lucide:triangle-alert" class="size-3" />{{ t('admin.appearance.libraryAccents.lowContrast') }}</p>
          <p v-else class="text-[11px] text-flixer-muted">{{ colors[library.id] ?? t('admin.appearance.libraryAccents.themeDefault') }}</p>
        </div>
        <button v-if="colors[library.id]" type="button" class="rounded p-2 text-flixer-muted hover:bg-white/10 hover:text-white" :aria-label="t('admin.appearance.libraryAccents.clear')" @click="clear(library.id)"><Icon icon="lucide:rotate-ccw" class="size-4" /></button>
      </li>
    </ul>
  </AdminSection>
</template>
