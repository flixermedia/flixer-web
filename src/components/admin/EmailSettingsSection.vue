<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import AdminSkeleton from './AdminSkeleton.vue'
import { getMailSettings, getMailStatus, listSettings, sendTestEmail, updateSetting, type MailSettings, type MailStatus, type ServerSetting, type SettingRequestValue } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import AdminSection from './AdminSection.vue'
import AdminToggle from './AdminToggle.vue'

const { t } = useI18n()
const form = reactive({ host: '', port: 587, secure: false, user: '', from: '', password: '' })
const saved = ref({ host: '', port: 587, secure: false, user: '', from: '' })
const passwordSet = ref(false)
const isLoading = ref(true)
const isSaving = ref(false)
const isTesting = ref(false)

const mailStatus = ref<MailStatus | null>(null)
const mailSettings = ref<MailSettings | null>(null)
const builtInReady = computed(() => mailStatus.value?.outboundReady === true)
const relayConfigured = computed(() => saved.value.host !== '')
const canSend = computed(() => builtInReady.value || relayConfigured.value)
const mailPage = { name: 'admin', query: { tab: 'mail', page: 'mailOverview' } }
const inputClass = 'mt-1 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-flixer-text'
const button = 'rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-60'

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

async function load() {
  try {
    const [statusError, status] = await catchError(Promise.all([getMailStatus(), getMailSettings()]))
    if (!statusError) [mailStatus.value, mailSettings.value] = status
    const [error, settings] = await catchError(listSettings())
    if (error) {
      console.error('[email] failed to load settings', error)
      notify.error(describeRequestError(error, t('admin.general.emailLoadFailed')))
    } else {
      const values = Object.fromEntries(settings.map((setting: ServerSetting) => [setting.key, setting.value]))
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
    }
  } finally {
    isLoading.value = false
  }
}

async function save() {
  if (!Number.isInteger(form.port) || form.port < 1 || form.port > 65535) {
    notify.error(t('admin.general.emailPortInvalid'))
    return
  }

  const changes: [string, SettingRequestValue][] = [
    ['smtp_host', form.host.trim()],
    ['smtp_port', form.port],
    ['smtp_secure', form.secure],
    ['smtp_user', form.user.trim()],
    ['smtp_from', form.from.trim()],
  ]
  if (form.password) changes.push(['smtp_password', form.password])

  isSaving.value = true
  try {
    let requestError: Error | undefined
    for (const [key, value] of changes) {
      const [error] = await catchError(updateSetting(key, value))
      if (error) {
        requestError = error
        break
      }
    }
    if (requestError) {
      console.error('[email] failed to save settings', requestError)
      notify.error(describeRequestError(requestError, t('admin.general.emailSaveFailed')))
    } else {
      notify.success(t('admin.general.emailSaved'))
    }
  } finally {
    isSaving.value = false
    await load()
  }
}

async function sendTest() {
  isTesting.value = true
  try {
    const [error, result] = await catchError(sendTestEmail())
    if (error) {
      console.error('[email] test email failed', error)
      notify.error(describeRequestError(error, t('admin.general.testEmailFailed')))
    } else {
      notify.success(t('admin.general.testEmailSent', { email: result.sentTo }))
    }
  } finally {
    isTesting.value = false
  }
}

onMounted(load)
</script>

<template>
  <AdminSection :title="t('admin.general.emailTitle')" :description="t('admin.general.emailDescription')">
    <template #actions>
      <button type="button" class="rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15 disabled:opacity-60" :disabled="isLoading || isTesting || !canSend" @click="sendTest">{{ t('admin.general.sendTestEmail') }}</button>
      <button type="button" :class="button" :disabled="isLoading || isSaving" @click="save">{{ t('common.save') }}</button>
    </template>
    <AdminSkeleton v-if="isLoading" variant="fields" :rows="5" />
    <template v-else>
      <div v-if="builtInReady" class="mb-4 flex items-start gap-3 rounded border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100" role="status">
        <Icon icon="lucide:circle-check" class="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <div class="min-w-0">
          <p class="font-semibold">{{ t('admin.general.emailBuiltInActive') }}</p>
          <p class="mt-1 text-xs text-emerald-100/80">{{ t('admin.general.emailBuiltInDetail', { sender: mailStatus?.sender ?? '' }) }}</p>
          <p class="mt-1 text-xs text-emerald-100/80">{{ mailSettings?.relayFallback && relayConfigured ? t('admin.general.emailRelayFallbackOn') : t('admin.general.emailRelayOptional') }}</p>
        </div>
      </div>
      <div v-else class="mb-4 flex items-start gap-3 rounded border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100" role="status">
        <Icon icon="lucide:triangle-alert" class="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <div class="min-w-0">
          <p class="font-semibold">{{ relayConfigured ? t('admin.general.emailRelayOnly') : t('admin.general.emailNotConfigured') }}</p>
          <p class="mt-1 text-xs text-amber-100/80">{{ t('admin.general.emailRecommendBuiltIn') }}</p>
          <RouterLink :to="mailPage" class="mt-2 inline-flex items-center gap-1.5 rounded bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"><Icon icon="lucide:server" class="size-3.5" aria-hidden="true" />{{ t('admin.general.emailSetUpBuiltIn') }}</RouterLink>
        </div>
      </div>
      <h3 class="text-sm font-semibold text-white">{{ t('admin.general.emailRelayTitle') }} <span class="ml-1 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-flixer-muted">{{ t('admin.general.optional') }}</span></h3>
      <p class="mb-3 mt-1 text-xs text-flixer-muted">{{ t('admin.general.emailRelayHint') }}</p>
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
