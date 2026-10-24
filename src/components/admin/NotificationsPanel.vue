<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { listAdminUsers, listSettings, sendAdminNotification, updateSetting, type AdminUser } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import AdminSection from './AdminSection.vue'
import AdminToggle from './AdminToggle.vue'

const { t } = useI18n()

const users = ref<AdminUser[]>([])
const title = ref('')
const body = ref('')
const url = ref('')
const everyone = ref(true)
const selected = ref<string[]>([])
const query = ref('')
const isSending = ref(false)

const inputClass = 'w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm outline-none transition focus:border-flixer-accent'

const filtered = computed(() => {
  const needle = query.value.trim().toLowerCase()
  return users.value.filter((user) => `${user.displayName} ${user.username}`.toLowerCase().includes(needle))
})

const urlValid = computed(() => url.value.trim() === '' || (url.value.trim().startsWith('/') && !url.value.trim().startsWith('//')))
const canSend = computed(() => title.value.trim() !== '' && body.value.trim() !== '' && urlValid.value && (everyone.value || selected.value.length > 0) && !isSending.value)

const enabled = ref(true)
const newMediaEnabled = ref(true)
const promptMode = ref<'button' | 'load'>('button')
const subject = ref('')
const savedSubject = ref('')
const isSavingSubject = ref(false)

async function saveSetting(key: string, value: unknown, revert: () => void) {
  try {
    await updateSetting(key, value)
  } catch (error) {
    revert()
    notify.error(describeRequestError(error))
  }
}

function setEnabled(value: boolean) {
  const previous = enabled.value
  enabled.value = value
  void saveSetting('notifications_enabled', value, () => (enabled.value = previous))
}

function setNewMedia(value: boolean) {
  const previous = newMediaEnabled.value
  newMediaEnabled.value = value
  void saveSetting('notifications_new_media_enabled', value, () => (newMediaEnabled.value = previous))
}

function setPromptMode(value: 'button' | 'load') {
  const previous = promptMode.value
  promptMode.value = value
  void saveSetting('notifications_permission_prompt', value, () => (promptMode.value = previous))
}

async function saveSubject() {
  isSavingSubject.value = true
  try {
    await updateSetting('notifications_vapid_subject', subject.value.trim())
    savedSubject.value = subject.value.trim()
    notify.success(t('admin.notifications.settings.saved'))
  } catch (error) {
    notify.error(describeRequestError(error))
  } finally {
    isSavingSubject.value = false
  }
}

onMounted(async () => {
  try {
    const [list, settings] = await Promise.all([listAdminUsers(), listSettings()])
    users.value = list
    const value = (key: string) => settings.find((setting) => setting.key === key)?.value
    enabled.value = value('notifications_enabled') !== false
    newMediaEnabled.value = value('notifications_new_media_enabled') !== false
    promptMode.value = value('notifications_permission_prompt') === 'load' ? 'load' : 'button'
    const stored = value('notifications_vapid_subject')
    subject.value = savedSubject.value = typeof stored === 'string' ? stored : ''
  } catch (error) {
    notify.error(describeRequestError(error))
  }
})

function toggle(id: string) {
  selected.value = selected.value.includes(id) ? selected.value.filter((value) => value !== id) : [...selected.value, id]
}

async function send() {
  if (!canSend.value) return
  isSending.value = true
  try {
    const result = await sendAdminNotification({
      title: title.value.trim(),
      body: body.value.trim(),
      url: url.value.trim() || undefined,
      userIds: everyone.value ? undefined : selected.value,
    })
    notify.success(t('admin.notifications.sent', { recipients: result.recipients, pushed: result.pushed }))
    title.value = ''
    body.value = ''
    url.value = ''
  } catch (error) {
    notify.error(describeRequestError(error))
  } finally {
    isSending.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
  <AdminSection :title="t('admin.notifications.settings.title')" :description="t('admin.notifications.settings.description')">
    <div class="flex max-w-xl flex-col gap-4">
      <div class="flex flex-col divide-y divide-flixer-border">
        <AdminToggle :model-value="enabled" :label="t('admin.notifications.settings.enabled')" :description="t('admin.notifications.settings.enabledHelp')" @update:model-value="setEnabled" />
        <AdminToggle :model-value="newMediaEnabled" :label="t('admin.notifications.settings.newMedia')" :description="t('admin.notifications.settings.newMediaHelp')" @update:model-value="setNewMedia" />
      </div>

      <fieldset class="flex flex-col gap-2 text-sm">
        <legend class="mb-1 font-medium">{{ t('admin.notifications.settings.prompt') }}</legend>
        <label class="flex items-start gap-2">
          <input type="radio" name="prompt" class="mt-1 accent-flixer-accent" :checked="promptMode === 'button'" @change="setPromptMode('button')" />
          <span>{{ t('admin.notifications.settings.promptButton') }}<span class="block text-xs text-flixer-muted">{{ t('admin.notifications.settings.promptButtonHelp') }}</span></span>
        </label>
        <label class="flex items-start gap-2">
          <input type="radio" name="prompt" class="mt-1 accent-flixer-accent" :checked="promptMode === 'load'" @change="setPromptMode('load')" />
          <span>{{ t('admin.notifications.settings.promptLoad') }}<span class="block text-xs text-flixer-muted">{{ t('admin.notifications.settings.promptLoadHelp') }}</span></span>
        </label>
      </fieldset>

      <form class="flex flex-col gap-1 text-sm" @submit.prevent="saveSubject">
        <label for="vapid-subject">{{ t('admin.notifications.settings.subject') }}</label>
        <div class="flex gap-2">
          <input id="vapid-subject" v-model="subject" placeholder="mailto:admin@example.com" :class="inputClass" />
          <button type="submit" :disabled="isSavingSubject || subject.trim() === savedSubject" class="shrink-0 rounded bg-flixer-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-60">{{ t('admin.notifications.settings.save') }}</button>
        </div>
        <span class="text-xs text-flixer-muted">{{ t('admin.notifications.settings.subjectHelp') }}</span>
      </form>
    </div>
  </AdminSection>

  <AdminSection :title="t('admin.notifications.title')" :description="t('admin.notifications.description')">
    <form class="flex max-w-xl flex-col gap-4" @submit.prevent="send">
      <label class="flex flex-col gap-1 text-sm">
        {{ t('admin.notifications.titleLabel') }}
        <input v-model="title" maxlength="120" required :class="inputClass" />
      </label>
      <label class="flex flex-col gap-1 text-sm">
        {{ t('admin.notifications.bodyLabel') }}
        <textarea v-model="body" maxlength="500" rows="3" required :class="inputClass"></textarea>
      </label>
      <label class="flex flex-col gap-1 text-sm">
        {{ t('admin.notifications.urlLabel') }}
        <input v-model="url" placeholder="/search" :class="inputClass" />
        <span class="text-xs" :class="urlValid ? 'text-flixer-muted' : 'text-red-400'">{{ urlValid ? t('admin.notifications.urlHelp') : t('admin.notifications.invalidUrl') }}</span>
      </label>

      <fieldset class="flex flex-col gap-2 text-sm">
        <legend class="mb-1">{{ t('admin.notifications.recipients') }}</legend>
        <label class="flex items-center gap-2"><input v-model="everyone" type="radio" :value="true" class="accent-flixer-accent" />{{ t('admin.notifications.everyone') }}</label>
        <label class="flex items-center gap-2"><input v-model="everyone" type="radio" :value="false" class="accent-flixer-accent" />{{ t('admin.notifications.selected') }}</label>
      </fieldset>

      <div v-if="!everyone" class="flex flex-col gap-2">
        <input v-model="query" type="search" :placeholder="t('admin.notifications.searchUsers')" :class="inputClass" />
        <p class="text-xs text-flixer-muted">{{ selected.length === 0 ? t('admin.notifications.noUsers') : t('admin.notifications.selectedCount', { count: selected.length }) }}</p>
        <ul class="max-h-60 overflow-y-auto rounded border border-flixer-border">
          <li v-for="user in filtered" :key="user.id">
            <label class="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm transition hover:bg-white/5">
              <input type="checkbox" class="accent-flixer-accent" :checked="selected.includes(user.id)" @change="toggle(user.id)" />
              <span class="font-medium">{{ user.displayName }}</span>
              <span class="text-xs text-flixer-muted">@{{ user.username }}</span>
            </label>
          </li>
        </ul>
      </div>

      <div>
        <button type="submit" :disabled="!canSend" class="rounded bg-flixer-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-60">
          {{ isSending ? t('admin.notifications.sending') : t('admin.notifications.send') }}
        </button>
      </div>
    </form>
  </AdminSection>
  </div>
</template>
