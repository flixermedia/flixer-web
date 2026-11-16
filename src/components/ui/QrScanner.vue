<script setup lang="ts">
import { BrowserQRCodeReader } from '@zxing/browser'
import type { IScannerControls } from '@zxing/browser'
import { ChecksumException, DecodeHintType, FormatException, NotFoundException } from '@zxing/library'
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ startLabel: string; startAutomatically?: boolean; ignore?: (value: string) => boolean }>()
const emit = defineEmits<{ scanned: [value: string]; start: [] }>()
const { t } = useI18n()
const video = ref<HTMLVideoElement | null>(null)
const scanning = ref(false)
const error = ref('')
let controls: IScannerControls | undefined
let generation = 0

async function startCamera() {
  if (!video.value || scanning.value) return
  const current = ++generation
  error.value = ''
  scanning.value = true
  emit('start')
  try {
    await nextTick()
    const preview = video.value
    if (!preview) throw new Error('Camera preview is unavailable')

    const reader = new BrowserQRCodeReader(new Map([[DecodeHintType.TRY_HARDER, true]]))
    const activeControls = await reader.decodeFromConstraints({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } }, preview, (result, decodeError, scanControls) => {
      if (current !== generation || !scanning.value) {
        scanControls.stop()
        return
      }
      if (!result) {
        if (decodeError && !(decodeError instanceof NotFoundException || decodeError instanceof ChecksumException || decodeError instanceof FormatException)) {
          console.error('[qr-scanner] Scanning stopped unexpectedly', decodeError)
          scanControls.stop()
          controls = undefined
          scanning.value = false
          error.value = t('native.quickSetupScannerError')
        }
        return
      }
      const value = result.getText()
      if (props.ignore?.(value)) return
      scanControls.stop()
      controls = undefined
      scanning.value = false
      emit('scanned', value)
    })
    if (current !== generation || !scanning.value) {
      activeControls.stop()
      return
    }
    controls = activeControls
  } catch (cause) {
    if (current !== generation) return
    console.error('[qr-scanner] Could not start the camera', cause)
    scanning.value = false
    error.value = t('native.quickSetupCameraError')
  }
}

function stopCamera() {
  generation += 1
  controls?.stop()
  controls = undefined
  scanning.value = false
}

defineExpose({ stopCamera })
onMounted(() => {
  if (props.startAutomatically) void startCamera()
})
onBeforeUnmount(stopCamera)
</script>

<template>
  <div>
    <div v-show="scanning" class="mt-7 overflow-hidden rounded border border-flixer-border bg-black">
      <video ref="video" class="aspect-square w-full object-cover" autoplay muted playsinline></video>
    </div>
    <p v-if="scanning" role="status" class="mt-4 text-sm text-flixer-muted">{{ t('native.quickSetupScanning') }}</p>
    <p v-if="error" role="alert" class="mt-4 text-sm text-red-200">{{ error }}</p>
    <div class="mt-7 flex flex-wrap gap-3">
      <button
        type="button"
        :disabled="scanning"
        class="rounded bg-flixer-primary px-5 py-3 text-base font-bold text-white transition hover:bg-flixer-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:opacity-60"
        @click="startCamera"
      >
        {{ scanning ? t('native.quickSetupScanningButton') : startLabel }}
      </button>
      <button v-if="scanning" type="button" class="rounded border border-flixer-border px-5 py-3 text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" @click="stopCamera">
        {{ t('common.cancel') }}
      </button>
    </div>
  </div>
</template>
