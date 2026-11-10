<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import { APP_NAME_MAX, BUTTON_STYLES, CARD_STYLES, CONTENT_WIDTHS, CUSTOM_CSS_MAX, DEFAULT_MODES, DENSITIES, HEADER_HEIGHTS, HEADER_STYLES, BACKGROUND_MAX_BYTES, IMAGE_MAX_BYTES, NAV_ALIGNMENTS, PALETTE_KEYS, RADIUS_MAX, THEME_DESCRIPTION_MAX, THEME_FONTS, THEME_NAME_MAX, createTheme, updateTheme, type AppTheme, type PaletteKey, type ThemeConfig, type ThemeDraft } from '../../api'
import { contrastRatio } from '../../composables/themeCss'
import { describeRequestError } from '../../composables/useProfile'
import { notify } from '../../composables/notify'
import MonacoEditor from './MonacoEditor.vue'
import AdminToggle from './AdminToggle.vue'
import ThemeHistoryPanel from './ThemeHistoryPanel.vue'
import ThemePreview from './ThemePreview.vue'

defineOptions({ modalGroup: 'default' })

const props = defineProps<{ theme?: AppTheme; draft?: ThemeDraft }>()
const { close, confirm } = useModalContext<AppTheme>()
const { t } = useI18n()

const source = props.theme ?? props.draft
const form = reactive<ThemeDraft>(JSON.parse(JSON.stringify(source ? { name: props.theme?.builtIn ? `${source.name} ${t('admin.appearance.copySuffix')}`.slice(0, THEME_NAME_MAX) : source.name, description: source.description, config: source.config } : ({} as ThemeDraft))))
const sections = ['colors', 'shape', 'layout', 'header', 'branding', 'css', 'history'] as const
type Section = (typeof sections)[number]
const sectionIcons: Record<Section, string> = { colors: 'lucide:palette', shape: 'lucide:square-round-corner', layout: 'lucide:layout-grid', header: 'lucide:panel-top', branding: 'lucide:badge-check', css: 'lucide:code-xml', history: 'lucide:history' }
const section = ref<Section>('colors')
const paletteMode = ref<'dark' | 'light'>('dark')
const previewMode = ref<'dark' | 'light'>('dark')
const saving = ref(false)
const error = ref('')

const config = form.config as ThemeConfig
// Themes saved before these options existed simply lack them.
config.layout.artworkAccent ??= false
config.branding.loginBackground ??= null
const palette = computed(() => config.colors[paletteMode.value])
const previewConfig = computed<ThemeConfig>(() => ({ ...config }))
const HEX = /^#[0-9a-f]{6}$/i

const contrastChecks = computed(() => {
  const colors = palette.value
  return [
    { id: 'text', ratio: contrastRatio(colors.text, colors.background), min: 4.5 },
    { id: 'muted', ratio: contrastRatio(colors.muted, colors.background), min: 3 },
    { id: 'ink', ratio: contrastRatio(colors.ink, colors.primary), min: 3 },
  ]
})

const hexValid = computed(() => (['dark', 'light'] as const).every((mode) => PALETTE_KEYS.every((key) => HEX.test(config.colors[mode][key]))))
const valid = computed(() => form.name.trim().length > 0 && form.name.length <= THEME_NAME_MAX && hexValid.value && config.customCss.length <= CUSTOM_CSS_MAX)

function setColor(key: PaletteKey, value: string) {
  config.colors[paletteMode.value][key] = value
}

function copyPalette() {
  const from = paletteMode.value === 'dark' ? 'light' : 'dark'
  config.colors[paletteMode.value] = { ...config.colors[from] }
}

function pickerValue(value: string): string {
  return HEX.test(value) ? value : '#000000'
}

async function readImage(event: Event, target: 'logo' | 'logoLight' | 'favicon' | 'loginBackground') {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  const limit = target === 'loginBackground' ? BACKGROUND_MAX_BYTES : IMAGE_MAX_BYTES
  if (file.size > limit) {
    notify.error(t('admin.appearance.editor.imageTooLarge', { size: Math.round(limit / 1024) }))
    return
  }
  config.branding[target] = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

async function save() {
  if (!valid.value || saving.value) return
  saving.value = true
  error.value = ''
  const payload: ThemeDraft = { name: form.name.trim(), description: form.description.trim(), config: JSON.parse(JSON.stringify(config)) }
  try {
    const saved = props.theme && !props.theme.builtIn ? await updateTheme(props.theme.id, payload) : await createTheme(payload)
    notify.success(t('admin.appearance.editor.saved'))
    confirm(saved)
  } catch (cause) {
    error.value = describeRequestError(cause, t('admin.appearance.editor.saveError'))
  } finally {
    saving.value = false
  }
}

const field = 'mt-1 w-full rounded border border-flixer-border bg-flixer-background/60 px-3 py-2 text-sm text-flixer-text outline-none focus:border-flixer-accent'
const label = 'text-xs font-medium text-flixer-muted'
const imageTargets = ['logo', 'logoLight', 'favicon', 'loginBackground'] as const
const visibleSections = computed(() => sections.filter((id) => id !== 'history' || isEditing.value))
const isEditing = computed(() => !!props.theme && !props.theme.builtIn)
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card flex h-[calc(100dvh-2rem)] w-full max-w-6xl flex-col rounded border border-flixer-border bg-flixer-surface p-0 text-flixer-text shadow-2xl shadow-black/60">
      <header class="flex flex-wrap items-start justify-between gap-3 border-b border-flixer-border p-5">
        <div>
          <ModalTitle class="text-lg font-semibold">{{ isEditing ? t('admin.appearance.editor.editTitle') : t('admin.appearance.editor.newTitle') }}</ModalTitle>
          <ModalDescription class="mt-1 text-sm text-flixer-muted">{{ t('admin.appearance.editor.description') }}</ModalDescription>
        </div>
        <button type="button" class="rounded p-2 text-flixer-muted hover:bg-white/10" :aria-label="t('admin.appearance.cancel')" @click="close()"><Icon icon="lucide:x" class="size-5" /></button>
      </header>

      <div class="grid min-h-0 flex-1 lg:grid-cols-[1fr_22rem]">
        <div class="flex min-h-0 flex-col">
          <div class="grid gap-3 border-b border-flixer-border p-4 sm:grid-cols-2">
            <label :class="label">{{ t('admin.appearance.editor.name') }}<input v-model="form.name" :maxlength="THEME_NAME_MAX" :class="field" /></label>
            <label :class="label">{{ t('admin.appearance.editor.descriptionLabel') }}<input v-model="form.description" :maxlength="THEME_DESCRIPTION_MAX" :class="field" /></label>
          </div>
          <nav class="flex gap-1 overflow-x-auto border-b border-flixer-border px-4 py-2" role="tablist">
            <button v-for="id in visibleSections" :key="id" type="button" role="tab" :aria-selected="section === id" class="flex items-center gap-2 whitespace-nowrap rounded px-3 py-1.5 text-sm font-semibold transition" :class="section === id ? 'bg-flixer-primary text-white' : 'text-flixer-muted hover:bg-white/5'" @click="section = id">
              <Icon :icon="sectionIcons[id]" class="size-4" />{{ t(`admin.appearance.sections.${id}`) }}
            </button>
          </nav>

          <div class="min-h-0 flex-1 overflow-y-auto p-5">
            <div v-if="section === 'colors'" class="grid gap-4">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex rounded bg-black/20 p-1">
                  <button v-for="mode in ['dark', 'light'] as const" :key="mode" type="button" class="rounded px-3 py-1.5 text-xs font-semibold" :class="paletteMode === mode ? 'bg-white/10 text-white' : 'text-flixer-muted'" @click="((paletteMode = mode), (previewMode = mode))">{{ t(`admin.appearance.modes.${mode}`) }}</button>
                </div>
                <button type="button" class="rounded border border-flixer-border px-3 py-1.5 text-xs font-semibold hover:bg-white/5" @click="copyPalette">{{ t('admin.appearance.editor.copyPalette', { from: t(`admin.appearance.modes.${paletteMode === 'dark' ? 'light' : 'dark'}`) }) }}</button>
              </div>
              <div class="grid gap-3 sm:grid-cols-2">
                <div v-for="key in PALETTE_KEYS" :key="key" class="flex items-center gap-3 rounded border border-flixer-border bg-flixer-background/40 p-2">
                  <input type="color" :value="pickerValue(palette[key])" class="size-9 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0" :aria-label="t(`admin.appearance.colors.${key}`)" @input="setColor(key, ($event.target as HTMLInputElement).value)" />
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium">{{ t(`admin.appearance.colors.${key}`) }}</p>
                    <p class="truncate text-[11px] text-flixer-muted">{{ t(`admin.appearance.colors.${key}Hint`) }}</p>
                  </div>
                  <input :value="palette[key]" maxlength="7" spellcheck="false" class="w-24 rounded border bg-flixer-background/60 px-2 py-1 font-mono text-xs" :class="HEX.test(palette[key]) ? 'border-flixer-border' : 'border-red-500'" @input="setColor(key, ($event.target as HTMLInputElement).value)" />
                </div>
              </div>
              <ul class="grid gap-1 text-xs">
                <li v-for="check in contrastChecks" :key="check.id" class="flex items-center gap-2" :class="check.ratio >= check.min ? 'text-flixer-muted' : 'text-amber-400'">
                  <Icon :icon="check.ratio >= check.min ? 'lucide:check' : 'lucide:triangle-alert'" class="size-3.5" />
                  {{ t(`admin.appearance.contrast.${check.id}`, { ratio: check.ratio.toFixed(1) }) }}
                </li>
              </ul>
            </div>

            <div v-else-if="section === 'shape'" class="grid gap-5">
              <label :class="label">
                {{ t('admin.appearance.editor.radius', { value: config.shape.radius.toFixed(2) }) }}
                <input v-model.number="config.shape.radius" type="range" min="0" :max="RADIUS_MAX" step="0.05" class="mt-2 w-full accent-flixer-primary" />
              </label>
              <label :class="label">{{ t('admin.appearance.editor.font') }}
                <select v-model="config.typography.font" :class="field"><option v-for="font in THEME_FONTS" :key="font" :value="font">{{ t(`admin.appearance.options.${font}`) }}</option></select>
              </label>
              <label :class="label">{{ t('admin.appearance.editor.defaultMode') }}
                <select v-model="config.defaultMode" :class="field"><option v-for="mode in DEFAULT_MODES" :key="mode" :value="mode">{{ t(`admin.appearance.modes.${mode}`) }}</option></select>
                <span class="mt-1 block">{{ t('admin.appearance.editor.defaultModeHint') }}</span>
              </label>
            </div>

            <div v-else-if="section === 'layout'" class="grid gap-4 sm:grid-cols-2">
              <label :class="label">{{ t('admin.appearance.editor.contentWidth') }}<select v-model="config.layout.contentWidth" :class="field"><option v-for="v in CONTENT_WIDTHS" :key="v" :value="v">{{ t(`admin.appearance.options.${v}`) }}</option></select></label>
              <label :class="label">{{ t('admin.appearance.editor.density') }}<select v-model="config.layout.density" :class="field"><option v-for="v in DENSITIES" :key="v" :value="v">{{ t(`admin.appearance.options.${v}`) }}</option></select></label>
              <label :class="label">{{ t('admin.appearance.editor.cardStyle') }}<select v-model="config.layout.cardStyle" :class="field"><option v-for="v in CARD_STYLES" :key="v" :value="v">{{ t(`admin.appearance.options.${v}`) }}</option></select></label>
              <label :class="label">{{ t('admin.appearance.editor.buttonStyle') }}<select v-model="config.layout.buttonStyle" :class="field"><option v-for="v in BUTTON_STYLES" :key="v" :value="v">{{ t(`admin.appearance.options.${v}`) }}</option></select></label>
              <div class="sm:col-span-2"><AdminToggle v-model="config.layout.artworkAccent" :label="t('admin.appearance.editor.artworkAccent')" :description="t('admin.appearance.editor.artworkAccentHint')" /></div>
            </div>

            <div v-else-if="section === 'header'" class="grid gap-4 sm:grid-cols-2">
              <label :class="label">{{ t('admin.appearance.editor.headerStyle') }}<select v-model="config.header.style" :class="field"><option v-for="v in HEADER_STYLES" :key="v" :value="v">{{ t(`admin.appearance.options.${v}`) }}</option></select></label>
              <label :class="label">{{ t('admin.appearance.editor.headerHeight') }}<select v-model="config.header.height" :class="field"><option v-for="v in HEADER_HEIGHTS" :key="v" :value="v">{{ t(`admin.appearance.options.${v}`) }}</option></select></label>
              <label :class="label">{{ t('admin.appearance.editor.navAlign') }}<select v-model="config.header.navAlign" :class="field"><option v-for="v in NAV_ALIGNMENTS" :key="v" :value="v">{{ t(`admin.appearance.options.${v}`) }}</option></select></label>
              <div class="sm:col-span-2"><AdminToggle v-model="config.header.showName" :label="t('admin.appearance.editor.showName')" :description="t('admin.appearance.editor.showNameHint')" /></div>
            </div>

            <div v-else-if="section === 'branding'" class="grid gap-5">
              <label :class="label">{{ t('admin.appearance.editor.appName') }}
                <input :value="config.branding.appName ?? ''" :maxlength="APP_NAME_MAX" placeholder="Flixer" :class="field" @input="config.branding.appName = ($event.target as HTMLInputElement).value || null" />
                <span class="mt-1 block">{{ t('admin.appearance.editor.appNameHint') }}</span>
              </label>
              <div v-for="target in imageTargets" :key="target" class="flex items-center gap-4 rounded border border-flixer-border bg-flixer-background/40 p-3">
                <div class="grid size-16 shrink-0 place-items-center rounded border border-dashed border-flixer-border" :class="target === 'logoLight' && 'bg-white'">
                  <img v-if="config.branding[target]" :src="config.branding[target]!" alt="" class="max-h-12 max-w-14 object-contain" />
                  <Icon v-else icon="lucide:image" class="size-6 text-flixer-muted" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium">{{ t(`admin.appearance.editor.${target}`) }}</p>
                  <p class="text-xs text-flixer-muted">{{ t(`admin.appearance.editor.${target}Hint`, { size: Math.round((target === 'loginBackground' ? BACKGROUND_MAX_BYTES : IMAGE_MAX_BYTES) / 1024) }) }}</p>
                </div>
                <label class="cursor-pointer rounded border border-flixer-border px-3 py-1.5 text-xs font-semibold hover:bg-white/5">
                  {{ t('admin.appearance.editor.upload') }}
                  <input type="file" :accept="target === 'loginBackground' ? 'image/png,image/jpeg,image/webp' : 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/x-icon'" class="sr-only" @change="readImage($event, target)" />
                </label>
                <button v-if="config.branding[target]" type="button" class="rounded p-2 text-flixer-muted hover:bg-white/10" :aria-label="t('admin.appearance.editor.remove')" @click="config.branding[target] = null"><Icon icon="lucide:trash-2" class="size-4" /></button>
              </div>
            </div>

            <ThemeHistoryPanel v-else-if="section === 'history' && props.theme" :theme-id="props.theme.id" @restored="confirm($event)" />

            <div v-else class="grid gap-3">
              <p class="rounded border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">{{ t('admin.appearance.editor.cssNotice') }}</p>
              <MonacoEditor v-model="config.customCss" language="css" :label="t('admin.appearance.sections.css')" height="22rem" />
              <p class="text-right text-xs" :class="config.customCss.length > CUSTOM_CSS_MAX ? 'text-red-400' : 'text-flixer-muted'">{{ config.customCss.length }} / {{ CUSTOM_CSS_MAX }}</p>
            </div>
          </div>
        </div>

        <aside class="hidden min-h-0 flex-col gap-3 overflow-y-auto border-l border-flixer-border p-4 lg:flex">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold">{{ t('admin.appearance.editor.preview') }}</h3>
            <div class="flex rounded bg-black/20 p-1">
              <button v-for="mode in ['dark', 'light'] as const" :key="mode" type="button" class="rounded px-2 py-1 text-xs" :class="previewMode === mode ? 'bg-white/10 text-white' : 'text-flixer-muted'" @click="previewMode = mode">{{ t(`admin.appearance.modes.${mode}`) }}</button>
            </div>
          </div>
          <ThemePreview :config="previewConfig" :mode="previewMode" />
          <p class="text-xs text-flixer-muted">{{ t('admin.appearance.editor.previewHint') }}</p>
        </aside>
      </div>

      <footer class="flex flex-wrap items-center justify-between gap-3 border-t border-flixer-border p-4">
        <p class="text-xs text-red-400" role="alert">{{ error }}</p>
        <div class="flex gap-2">
          <button type="button" class="rounded border border-flixer-border px-4 py-2 text-sm font-semibold hover:bg-white/5" @click="close()">{{ t('admin.appearance.cancel') }}</button>
          <button type="button" :disabled="!valid || saving" class="rounded bg-flixer-primary px-4 py-2 text-sm font-semibold text-white hover:bg-flixer-primary/80 disabled:cursor-not-allowed disabled:opacity-50" @click="save">{{ saving ? t('admin.appearance.saving') : t('admin.appearance.editor.save') }}</button>
        </div>
      </footer>
    </ModalContent>
  </ModalRoot>
</template>
