<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { listSettings, sendTestEmail, updateSetting, type ServerSetting } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import AdminSection from './AdminSection.vue'
import AdminToggle from './AdminToggle.vue'

const { t } = useI18n()
const form = reactive({ host: '', port: 587, secure: false, user: '', from: '', password: '' })
const saved = ref({ host: '', port: 587, secure: false, user: '', from: '' })
const passwordSet = ref(false)
const isLoading = ref(true)
const isSaving = ref(false)
const isTesting = ref(false)

const isConfigured = computed(() => saved.value.host !== '')
const inputClass = 'mt-1 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-flixer-text'
const button = 'rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-60'

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

async function load() {
  try {
    const values = Object.fromEntries((await listSettings()).map((setting: ServerSetting) => [setting.key, setting.value]))
    const port = Number(values.smtp_port)
    saved.value = {
      host: text(values.smtp_host),
      port: Number.isInteger(port) && port > 0 ? port : 587,
      secure: values.smtp_secure === true,
      user: text(values.smtp_user),
      from: text(values.smtp_from),
    }
    Object.assign(form, saved.value, { password: '' })
    passwordSet.value = text(values.smtp_password) !== ''
  } catch (error: unknown) {
    console.error('[email] failed to load settings', error)
    notify.error(describeRequestError(error, t('admin.general.emailLoadFailed')))
  } finally {
    isLoading.value = false
  }
}

async function save() {
  if (!Number.isInteger(form.port) || form.port < 1 || form.port > 65535) {
    notify.error(t('admin.general.emailPortInvalid'))
    return
  }

  const changes: [string, unknown][] = [
    ['smtp_host', form.host.trim()],
    ['smtp_port', form.port],
    ['smtp_secure', form.secure],
    ['smtp_user', form.user.trim()],
    ['smtp_from', form.from.trim()],
  ]
  if (form.password) changes.push(['smtp_password', form.password])

  isSaving.value = true
  try {
    for (const [key, value] of changes) {
      await updateSetting(key, value)
    }
    notify.success(t('admin.general.emailSaved'))
  } catch (error: unknown) {
    console.error('[email] failed to save settings', error)
    notify.error(describeRequestError(error, t('admin.general.emailSaveFailed')))
  } finally {
    isSaving.value = false
    await load()
  }
}

async function sendTest() {
  isTesting.value = true
  try {
    const result = await sendTestEmail()
    notify.success(t('admin.general.testEmailSent', { email: result.sentTo }))
  } catch (error: unknown) {
    console.error('[email] test email failed', error)
    notify.error(describeRequestError(error, t('admin.general.testEmailFailed')))
  } finally {
    isTesting.value = false
  }
}

onMounted(load)
</script>

<template>
  <AdminSection :title="t('admin.general.emailTitle')" :description="t('admin.general.emailDescription')">
    <template #actions>
      <button type="button" class="rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15 disabled:opacity-60" :disabled="isLoading || isTesting || !isConfigured" @click="sendTest">{{ t('admin.general.sendTestEmail') }}</button>
      <button type="button" :class="button" :disabled="isLoading || isSaving" @click="save">{{ t('common.save') }}</button>
    </template>
    <p v-if="isLoading" class="text-sm text-flixer-muted">{{ t('admin.general.emailLoading') }}</p>
    <template v-else>
      <p v-if="!isConfigured" class="mb-3 text-xs text-flixer-muted">{{ t('admin.general.emailNotConfigured') }}</p>
      <div class="grid gap-4 md:grid-cols-3">
        <label class="text-xs text-flixer-muted">{{ t('admin.general.smtpHost') }}<input v-model="form.host" placeholder="smtp.yourdomain.com" autocomplete="off" :class="inputClass" /></label>
        <label class="text-xs text-flixer-muted">{{ t('admin.general.smtpPort') }}<input v-model.number="form.port" type="number" min="1" max="65535" :class="inputClass" /></label>
        <label class="text-xs text-flixer-muted">{{ t('admin.general.fromAddress') }}<input v-model="form.from" placeholder="Flixer &lt;no-reply@yourdomain.com&gt;" autocomplete="off" :class="inputClass" /></label>
        <label class="text-xs text-flixer-muted">{{ t('admin.general.smtpUser') }}<input v-model="form.user" autocomplete="off" :class="inputClass" /></label>
        <label class="text-xs text-flixer-muted">
          {{ t('admin.general.smtpPassword') }}
          <input v-model="form.password" type="password" autocomplete="new-password" :placeholder="passwordSet ? t('admin.general.smtpPasswordSet') : ''" :class="inputClass" />
        </label>
      </div>
      <div class="mt-3">
        <AdminToggle v-model="form.secure" :label="t('admin.general.smtpSecure')" />
      </div>
    </template>
  </AdminSection>
</template>
