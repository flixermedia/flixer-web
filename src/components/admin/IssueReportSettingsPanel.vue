<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { TagsInputInput, TagsInputItem, TagsInputItemDelete, TagsInputItemText, TagsInputRoot } from 'reka-ui'
import { useI18n } from 'vue-i18n'
import { listSettings, updateSetting, type SettingRequestValue } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import AdminSection from './AdminSection.vue'
import AdminToggle from './AdminToggle.vue'

const { t } = useI18n()
const enabled = ref(true)
const chatEnabled = ref(true)
const categories = ref<string[]>([])
const loading = ref(true)
const saving = ref(false)
const tagInputClass = 'min-w-40 flex-1 bg-transparent py-1 text-sm text-white outline-none placeholder:text-flixer-muted'

async function save(key: string, value: SettingRequestValue) {
  const [failure] = await catchError(updateSetting(key, value))
  if (failure) {
    notify.error(describeRequestError(failure))
    return false
  }
  return true
}

async function setEnabled(value: boolean) {
  const previous = enabled.value
  enabled.value = value
  if (!(await save('issue_reports_enabled', value))) enabled.value = previous
}

async function setChatEnabled(value: boolean) {
  const previous = chatEnabled.value
  chatEnabled.value = value
  if (!(await save('issue_reports_chat_enabled', value))) chatEnabled.value = previous
}

async function saveCategories() {
  const updatedCategories = [...new Set(categories.value.map((category) => category.trim()).filter(Boolean))]
  if (!updatedCategories.length || updatedCategories.length > 20 || updatedCategories.some((category) => category.length > 60)) {
    notify.error(t('issues.categoriesInvalid'))
    return
  }
  saving.value = true
  if (await save('issue_reports_categories', updatedCategories)) {
    categories.value = updatedCategories
    notify.success(t('issues.settingsSaved'))
  }
  saving.value = false
}

onMounted(async () => {
  const [failure, settings] = await catchError(listSettings())
  loading.value = false
  if (failure) {
    notify.error(describeRequestError(failure))
    return
  }
  const value = (key: string) => settings.find((setting) => setting.key === key)?.value
  enabled.value = value('issue_reports_enabled') !== false
  chatEnabled.value = value('issue_reports_chat_enabled') !== false
  const savedCategories = value('issue_reports_categories')
  categories.value = Array.isArray(savedCategories) && savedCategories.every((item) => typeof item === 'string') ? savedCategories : []
})
</script>

<template>
  <AdminSection :title="t('issues.settingsTitle')" :description="t('issues.settingsDescription')">
    <p v-if="loading" class="text-sm text-flixer-muted" role="status">{{ t('issues.loading') }}</p>
    <div v-else class="max-w-2xl space-y-5">
      <div class="divide-y divide-flixer-border">
        <AdminToggle :model-value="enabled" :label="t('issues.enableReports')" :description="t('issues.enableReportsHelp')" @update:model-value="setEnabled" />
        <AdminToggle :model-value="chatEnabled" :label="t('issues.enableChat')" :description="t('issues.enableChatHelp')" @update:model-value="setChatEnabled" />
      </div>
      <div class="space-y-1">
        <p id="issue-report-categories-label" class="text-sm">{{ t('issues.categories') }}</p>
        <TagsInputRoot
          v-model="categories"
          :max="20"
          :delimiter="/[,\n\r]+/"
          add-on-paste
          :disabled="saving"
          aria-labelledby="issue-report-categories-label"
          class="flex min-h-32 flex-wrap items-center gap-2 rounded border border-flixer-border bg-flixer-background px-3 py-2 focus-within:border-flixer-accent"
        >
          <TagsInputItem v-for="category in categories" :key="category" :value="category" class="flex items-center gap-1 rounded bg-flixer-primary/20 px-2 py-1 text-sm text-white">
            <TagsInputItemText />
            <TagsInputItemDelete class="rounded px-1 text-flixer-muted hover:text-white focus-visible:outline-2 focus-visible:outline-flixer-accent">×</TagsInputItemDelete>
          </TagsInputItem>
          <TagsInputInput :class="tagInputClass" :placeholder="t('issues.categoriesPlaceholder')" />
        </TagsInputRoot>
        <span class="text-xs text-flixer-muted">{{ t('issues.categoriesHelp') }}</span>
      </div>
      <button type="button" :disabled="saving" class="rounded bg-flixer-primary px-4 py-2 text-sm font-semibold text-white hover:bg-flixer-primary/80 disabled:opacity-50" @click="saveCategories">
        {{ saving ? t('issues.saving') : t('issues.saveSettings') }}
      </button>
    </div>
  </AdminSection>
</template>
