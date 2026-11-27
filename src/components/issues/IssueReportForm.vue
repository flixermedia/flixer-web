<script setup lang="ts">
import { Button } from '@ui-sdk/vue/button'
import { Field, FieldLabel } from '@ui-sdk/vue/field'
import { Input } from '@ui-sdk/vue/input'
import { Textarea } from '@ui-sdk/vue/textarea'
import { Icon } from '@iconify/vue'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { createIssueReport, type IssueReport } from '../../api'
import { useIssueReportsConfig } from '../../composables/useIssueReportsConfig'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import { capturePageScreenshotAttachment, readImageFilesAsAttachments, type IssueAttachmentDraft } from '../../utils/issueAttachments'

const props = defineProps<{ mediaItemId?: string; mediaTitle?: string; modal?: boolean }>()
const emit = defineEmits<{ submitted: [report: IssueReport] }>()
const { t } = useI18n()
const { config, load } = useIssueReportsConfig()
const title = ref(props.mediaTitle ? `${t('issues.issueWith')} ${props.mediaTitle}` : '')
const category = ref('')
const description = ref('')
const attachments = ref<IssueAttachmentDraft[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
const capturing = ref(false)
const loading = ref(true)
const submitting = ref(false)
const error = ref('')
const canSubmit = computed(() => title.value.trim() && category.value && description.value.trim() && !submitting.value && !capturing.value)

async function onFilesSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (!files?.length) return
  error.value = ''
  try {
    const remaining = Math.max(0, 4 - attachments.value.length)
    if (remaining === 0) {
      error.value = 'Maximum 4 images allowed.'
      return
    }
    const added = await readImageFilesAsAttachments(files, remaining)
    attachments.value.push(...added)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to read selected image.'
  } finally {
    input.value = ''
  }
}

async function captureScreenshot() {
  if (capturing.value || attachments.value.length >= 4) return
  capturing.value = true
  error.value = ''
  try {
    const shot = await capturePageScreenshotAttachment()
    attachments.value.push(shot)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to capture screenshot.'
  } finally {
    capturing.value = false
  }
}

function removeAttachment(index: number) {
  attachments.value.splice(index, 1)
}

async function submit() {
  if (!canSubmit.value) return
  submitting.value = true
  error.value = ''
  try {
    const [failure, report] = await catchError(createIssueReport({
      title: title.value.trim(),
      category: category.value,
      description: description.value.trim(),
      mediaItemId: props.mediaItemId,
      attachments: attachments.value.length ? attachments.value : undefined,
    }))
    if (failure) {
      error.value = describeRequestError(failure)
      return
    }
    emit('submitted', report)
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await load()
  category.value = config.value?.categories[0] ?? ''
  loading.value = false
})
</script>

<template>
  <form :class="modal ? 'flixer-modal-form' : 'flex flex-col gap-4'" @submit.prevent="submit">
    <div :class="modal ? 'flixer-modal-form-body gap-4' : 'flex flex-col gap-4'">
      <p v-if="error" class="rounded border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200" role="alert">{{ error }}</p>
      <p v-if="loading" class="text-sm text-flixer-muted" role="status">{{ t('issues.loading') }}</p>
      <template v-else>
        <Field class="gap-1 text-sm">
          <FieldLabel>{{ t('issues.subject') }}</FieldLabel>
          <Input v-model="title" maxlength="200" required class="h-auto rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-white outline-none focus:border-flixer-accent focus-visible:border-flixer-accent" />
        </Field>
        <label class="flex flex-col gap-1 text-sm">
          {{ t('issues.category') }}
          <select v-model="category" required class="rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-white outline-none focus:border-flixer-accent">
            <option v-for="name in config?.categories ?? []" :key="name" :value="name">{{ name }}</option>
          </select>
        </label>
        <Field class="gap-1 text-sm">
          <FieldLabel>{{ t('issues.description') }}</FieldLabel>
          <Textarea v-model="description" rows="5" maxlength="5000" required class="min-h-0 resize-y rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-white outline-none focus:border-flixer-accent focus-visible:border-flixer-accent" />
        </Field>
        <div class="flex flex-col gap-2 text-sm">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-flixer-muted">Images &amp; Screenshots (up to 4)</span>
            <div class="flex items-center gap-2">
              <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple class="hidden" @change="onFilesSelected" />
              <button
                type="button"
                :disabled="attachments.length >= 4 || submitting"
                class="inline-flex items-center gap-1.5 rounded border border-flixer-border bg-white/[0.06] px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/10 disabled:opacity-40"
                @click="fileInput?.click()"
              >
                <Icon icon="lucide:image-plus" class="size-3.5 text-flixer-accent" />
                Upload Image
              </button>
              <button
                type="button"
                :disabled="attachments.length >= 4 || submitting || capturing"
                class="inline-flex items-center gap-1.5 rounded border border-flixer-border bg-white/[0.06] px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/10 disabled:opacity-40"
                @click="captureScreenshot"
              >
                <Icon icon="lucide:camera" class="size-3.5 text-flixer-accent" />
                {{ capturing ? 'Capturing...' : 'Screenshot' }}
              </button>
            </div>
          </div>
          <div v-if="attachments.length" class="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div v-for="(item, idx) in attachments" :key="`${item.name}-${idx}`" class="group relative overflow-hidden rounded border border-flixer-border bg-flixer-background">
              <img :src="item.dataUrl" :alt="item.name" class="h-20 w-full object-cover" />
              <button
                type="button"
                class="absolute right-1 top-1 grid size-5 place-items-center rounded bg-black/75 text-white/90 transition hover:bg-red-500"
                aria-label="Remove attachment"
                @click="removeAttachment(idx)"
              >
                <Icon icon="lucide:x" class="size-3" />
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>
    <div v-if="!loading" :class="modal ? 'flixer-modal-actions flex justify-end' : ''">
      <Button type="submit" :disabled="!canSubmit || loading" :data-agent-confirm="t('issues.submit')" class="rounded border-0 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50" :class="modal ? 'h-11 bg-flixer-primary px-6 text-white hover:brightness-110' : 'h-auto w-full bg-white px-4 py-2 text-flixer-background hover:bg-white/85'">
        {{ submitting ? t('issues.submitting') : t('issues.submit') }}
      </Button>
    </div>
  </form>
</template>
