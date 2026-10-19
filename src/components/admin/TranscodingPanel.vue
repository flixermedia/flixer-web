<script setup lang="ts">
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminSection from './AdminSection.vue'
import AdminToggle from './AdminToggle.vue'

const { t } = useI18n()

const form = reactive({
  hwAccel: 'none',
  hwDecode: true,
  tonemap: true,
  throttle: true,
  maxTranscodes: 2,
  threads: 0,
  preset: 'veryfast',
  crf: 23,
  maxBitrate: 20,
  tempPath: '/var/lib/flixer/transcodes',
  audio: true,
  subtitles: true,
  hevc: false,
})
const inputClass = 'mt-1 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-flixer-text'
</script>

<template>
  <div class="flex flex-col gap-6">
    <AdminSection :title="t('admin.transcoding.title')" :description="t('admin.transcoding.description')">
      <template #actions>
        <button type="button" class="rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80">{{ t('common.save') }}</button>
      </template>
      <div class="grid gap-x-8 gap-y-4 md:grid-cols-2">
        <label class="text-xs text-flixer-muted">
          {{ t('admin.transcoding.hardwareAcceleration') }}
          <select v-model="form.hwAccel" :class="inputClass">
            <option value="none">{{ t('admin.transcoding.noneSoftware') }}</option>
            <option value="nvenc">{{ t('admin.transcoding.nvidiaNvenc') }}</option>
            <option value="qsv">{{ t('admin.transcoding.intelQuickSync') }}</option>
            <option value="vaapi">{{ t('admin.transcoding.vaapi') }}</option>
            <option value="amf">{{ t('admin.transcoding.amdAmf') }}</option>
          </select>
        </label>
        <label class="text-xs text-flixer-muted">
          {{ t('admin.transcoding.encoderPreset') }}
          <select v-model="form.preset" :class="inputClass">
            <option value="ultrafast">{{ t('admin.transcoding.presetUltrafast') }}</option>
            <option value="veryfast">{{ t('admin.transcoding.presetVeryfast') }}</option>
            <option value="fast">{{ t('admin.transcoding.presetFast') }}</option>
            <option value="medium">{{ t('admin.transcoding.presetMedium') }}</option>
            <option value="slow">{{ t('admin.transcoding.presetSlow') }}</option>
          </select>
        </label>
        <label class="text-xs text-flixer-muted">
          {{ t('admin.transcoding.concurrentTranscodes') }}
          <input v-model.number="form.maxTranscodes" type="number" min="0" :class="inputClass" />
        </label>
        <label class="text-xs text-flixer-muted">
          {{ t('admin.transcoding.encodingThreads') }}
          <input v-model.number="form.threads" type="number" min="0" :class="inputClass" />
        </label>
        <label class="text-xs text-flixer-muted">
          {{ t('admin.transcoding.constantRateFactor') }}: {{ form.crf }}
          <input v-model.number="form.crf" type="range" min="16" max="32" class="mt-2 w-full accent-flixer-primary" />
        </label>
        <label class="text-xs text-flixer-muted">
          {{ t('admin.transcoding.maximumStreamingBitrate') }}
          <input v-model.number="form.maxBitrate" type="number" min="1" :class="inputClass" />
        </label>
        <label class="text-xs text-flixer-muted md:col-span-2">
          {{ t('admin.transcoding.transcodeTempPath') }}
          <input v-model="form.tempPath" :class="[inputClass, 'font-mono']" />
        </label>
      </div>
      <div class="mt-4 grid gap-x-8 md:grid-cols-2">
        <AdminToggle v-model="form.hwDecode" :label="t('admin.transcoding.hardwareDecoding')" />
        <AdminToggle v-model="form.tonemap" :label="t('admin.transcoding.hdrToneMapping')" :description="t('admin.transcoding.hdrToneMappingDescription')" />
        <AdminToggle v-model="form.throttle" :label="t('admin.transcoding.throttleTranscodes')" :description="t('admin.transcoding.throttleDescription')" />
        <AdminToggle v-model="form.hevc" :label="t('admin.transcoding.allowHevcEncoding')" />
        <AdminToggle v-model="form.audio" :label="t('admin.transcoding.allowAudioTranscoding')" />
        <AdminToggle v-model="form.subtitles" :label="t('admin.transcoding.burnInSubtitles')" />
      </div>
    </AdminSection>
  </div>
</template>
