<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { createIssueReport, type IssueReport } from '../../api'
import { useIssueReportsConfig } from '../../composables/useIssueReportsConfig'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'

const props = defineProps<{ mediaItemId?: string; mediaTitle?: string }>()
const emit = defineEmits<{ submitted: [report: IssueReport] }>()
const { t } = useI18n()
const { config, load } = useIssueReportsConfig()
const title = ref(props.mediaTitle ? `${t('issues.issueWith')} ${props.mediaTitle}` : '')
const category = ref('')
const description = ref('')
const loading = ref(true)
const submitting = ref(false)
const error = ref('')
const canSubmit = computed(() => title.value.trim() && category.value && description.value.trim() && !submitting.value)

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
  <form class="flex flex-col gap-4" @submit.prevent="submit">
    <p v-if="error" class="rounded border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200" role="alert">{{ error }}</p>
    <p v-if="loading" class="text-sm text-flixer-muted" role="status">{{ t('issues.loading') }}</p>
    <template v-else>
      <label class="flex flex-col gap-1 text-sm">
        {{ t('issues.subject') }}
        <input v-model="title" maxlength="200" required class="rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-white outline-none focus:border-flixer-accent" />
      </label>
      <label class="flex flex-col gap-1 text-sm">
        {{ t('issues.category') }}
        <select v-model="category" required class="rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-white outline-none focus:border-flixer-accent">
          <option v-for="name in config?.categories ?? []" :key="name" :value="name">{{ name }}</option>
        </select>
      </label>
      <label class="flex flex-col gap-1 text-sm">
        {{ t('issues.description') }}
        <textarea v-model="description" rows="5" maxlength="5000" required class="resize-y rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-white outline-none focus:border-flixer-accent" />
      </label>
      <button type="submit" :disabled="!canSubmit || loading" class="rounded bg-white px-4 py-2 text-sm font-semibold text-flixer-background transition hover:bg-white/85 disabled:cursor-not-allowed disabled:opacity-50">
        {{ submitting ? t('issues.submitting') : t('issues.submit') }}
      </button>
    </template>
  </form>
</template>
