<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { listSettings, updateSetting, type ServerSetting, type SettingRequestValue } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import AdminSection from './AdminSection.vue'
import AdminSkeleton from './AdminSkeleton.vue'

const HW_ACCEL = [
  { value: 'none', label: 'admin.transcoding.noneSoftware' },
  { value: 'nvenc', label: 'admin.transcoding.nvidiaNvenc' },
  { value: 'qsv', label: 'admin.transcoding.intelQuickSync' },
  { value: 'vaapi', label: 'admin.transcoding.vaapi' },
  { value: 'amf', label: 'admin.transcoding.amdAmf' },
]
const PRESETS = [
  ['ultrafast', 'presetUltrafast'],
  ['superfast', 'presetSuperfast'],
  ['veryfast', 'presetVeryfast'],
  ['faster', 'presetFaster'],
  ['fast', 'presetFast'],
  ['medium', 'presetMedium'],
  ['slow', 'presetSlow'],
] as const

const { t } = useI18n()
const form = reactive({ hwAccel: 'none', preset: 'veryfast', crf: 23, threads: 0, maxBitrateMbps: 0, maxConcurrent: '' as number | '' })
const saved = ref<Record<string, unknown>>({})
const isLoading = ref(true)
const isSaving = ref(false)

const inputClass = 'mt-1 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-flixer-text'
const button = 'rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-60'

function number(value: unknown, fallback: number): number {
  return typeof value === 'number' ? value : fallback
}

async function load() {
  try {
    const [error, settings] = await catchError(listSettings())
    if (error) {
      console.error('[transcoding] failed to load settings', error)
      notify.error(describeRequestError(error, t('admin.transcoding.loadFailed')))
    } else {
      const values = Object.fromEntries(settings.map((setting: ServerSetting) => [setting.key, setting.value]))
      saved.value = values
      form.hwAccel = typeof values.transcode_hw_accel === 'string' ? values.transcode_hw_accel : 'none'
      form.preset = typeof values.transcode_preset === 'string' ? values.transcode_preset : 'veryfast'
      form.crf = number(values.transcode_crf, 23)
      form.threads = number(values.transcode_threads, 0)
      form.maxBitrateMbps = number(values.transcode_max_bitrate_kbps, 0) / 1000
      form.maxConcurrent = typeof values.transcode_max_concurrent === 'number' ? values.transcode_max_concurrent : ''
    }
  } finally {
    isLoading.value = false
  }
}

function whole(value: unknown, min: number, max: number): boolean {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
}

async function save() {
  const bitrate = Math.round(Number(form.maxBitrateMbps) * 1000)
  const concurrent = form.maxConcurrent === '' ? null : Number(form.maxConcurrent)
  if (!whole(Number(form.crf), 16, 32) || !whole(Number(form.threads), 0, 64) || !whole(bitrate, 0, 500_000) || (concurrent !== null && !whole(concurrent, 0, 100))) {
    notify.error(t('admin.transcoding.invalid'))
    return
  }

  const changes: [string, SettingRequestValue][] = [
    ['transcode_hw_accel', form.hwAccel],
    ['transcode_preset', form.preset],
    ['transcode_crf', Number(form.crf)],
    ['transcode_threads', Number(form.threads)],
    ['transcode_max_bitrate_kbps', bitrate],
    ['transcode_max_concurrent', concurrent],
  ]
  isSaving.value = true
  try {
    let requestError: Error | undefined
    for (const [key, value] of changes) {
      if (saved.value[key] !== value) {
        const [error] = await catchError(updateSetting(key, value))
        if (error) {
          requestError = error
          break
        }
      }
    }
    if (requestError) {
      console.error('[transcoding] failed to save settings', requestError)
      notify.error(describeRequestError(requestError, t('admin.transcoding.saveFailed')))
    } else {
      notify.success(t('admin.transcoding.saved'))
    }
  } finally {
    isSaving.value = false
    await load()
  }
}

onMounted(load)
</script>

<template>
  <div class="flex flex-col gap-6">
    <AdminSection :title="t('admin.transcoding.title')" :description="t('admin.transcoding.description')">
      <template #actions>
        <button type="button" :class="button" :disabled="isLoading || isSaving" @click="save">{{ t('common.save') }}</button>
      </template>
      <AdminSkeleton v-if="isLoading" variant="fields" :rows="6" />
      <div v-else class="grid gap-x-8 gap-y-4 md:grid-cols-2">
        <label class="text-xs text-flixer-muted">
          {{ t('admin.transcoding.hardwareAcceleration') }}
          <select v-model="form.hwAccel" :class="inputClass">
            <option v-for="option in HW_ACCEL" :key="option.value" :value="option.value">{{ t(option.label) }}</option>
          </select>
          <span class="mt-1 block">{{ t('admin.transcoding.hardwareHint') }}</span>
        </label>
        <label class="text-xs text-flixer-muted">
          {{ t('admin.transcoding.encoderPreset') }}
          <select v-model="form.preset" :class="inputClass">
            <option v-for="[value, key] in PRESETS" :key="value" :value="value">{{ t(`admin.transcoding.${key}`) }}</option>
          </select>
          <span class="mt-1 block">{{ t('admin.transcoding.presetHint') }}</span>
        </label>
        <label class="text-xs text-flixer-muted">
          {{ t('admin.transcoding.concurrentTranscodes') }}
          <input v-model.number="form.maxConcurrent" type="number" min="0" max="100" :class="inputClass" />
          <span class="mt-1 block">{{ t('admin.transcoding.concurrentHint') }}</span>
        </label>
        <label class="text-xs text-flixer-muted">
          {{ t('admin.transcoding.encodingThreads') }}
          <input v-model.number="form.threads" type="number" min="0" max="64" :class="inputClass" />
          <span class="mt-1 block">{{ t('admin.transcoding.threadsHint') }}</span>
        </label>
        <label class="text-xs text-flixer-muted">
          {{ t('admin.transcoding.constantRateFactor') }}: {{ form.crf }}
          <input v-model.number="form.crf" type="range" min="16" max="32" class="mt-2 w-full accent-flixer-primary" />
          <span class="mt-1 block">{{ t('admin.transcoding.crfHint') }}</span>
        </label>
        <label class="text-xs text-flixer-muted">
          {{ t('admin.transcoding.maximumStreamingBitrate') }}
          <input v-model.number="form.maxBitrateMbps" type="number" min="0" step="0.5" :class="inputClass" />
          <span class="mt-1 block">{{ t('admin.transcoding.bitrateHint') }}</span>
        </label>
      </div>
    </AdminSection>
  </div>
</template>
