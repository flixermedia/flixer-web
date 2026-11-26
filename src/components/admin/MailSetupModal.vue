<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { Button } from '@ui-sdk/vue/button'
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { createMailDomain, runMailDiagnostics, sendMailTemplateTest, updateMailSettings, verifyMailDomain, type MailCheck, type MailDomain, type MailSettings } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { copyToClipboard } from '../../utils/clipboard'
import { downloadCloudflareZoneFile, groupDnsRecords } from '../../utils/mailHelpers'
import AdminToggle from './AdminToggle.vue'
import StatusPill from './StatusPill.vue'

defineOptions({ modalGroup: 'default' })

const props = defineProps<{
  initialSettings?: MailSettings | null
  existingDomains?: MailDomain[]
}>()

const { close, confirm } = useModalContext<boolean>()
const { t } = useI18n()

type Step = 'domain' | 'dns' | 'test'
const step = ref<Step>('domain')
const busy = ref(false)
const error = ref('')

const firstDomain = props.existingDomains?.[0]
const form = reactive({
  domain: firstDomain?.domain ?? '',
  allowSubdomains: firstDomain?.allowSubdomains ?? false,
  hostname: props.initialSettings?.hostname ?? (firstDomain ? `mail.${firstDomain.domain}` : ''),
  noreplyAddress: props.initialSettings?.noreplyAddress ?? (firstDomain ? `noreply@${firstDomain.domain}` : ''),
  noreplyName: props.initialSettings?.noreplyName ?? 'Flixer',
  inboundEnabled: props.initialSettings?.inboundEnabled ?? true,
  outboundEnabled: props.initialSettings?.outboundEnabled ?? true,
})

const hostnameTouched = ref(Boolean(props.initialSettings?.hostname))
const noreplyTouched = ref(Boolean(props.initialSettings?.noreplyAddress))

watch(
  () => form.domain,
  (next) => {
    const clean = next.trim().toLowerCase()
    if (!clean) return
    if (!hostnameTouched.value) form.hostname = `mail.${clean}`
    if (!noreplyTouched.value) form.noreplyAddress = `noreply@${clean}`
  },
)

const activeDomain = ref<MailDomain | null>(firstDomain ?? null)
const diagnostics = ref<Record<string, MailCheck> | null>(null)
const testEmail = ref('')

const inputClass = 'mt-1 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-flixer-text placeholder:text-flixer-muted focus:border-flixer-accent focus:outline-none'
const primaryButtonClass = 'rounded bg-flixer-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:cursor-not-allowed disabled:opacity-50'
const secondaryButtonClass = 'rounded border border-flixer-border bg-transparent px-3 py-2 text-xs font-semibold text-flixer-text transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50'

const dnsGroups = computed(() => (activeDomain.value ? groupDnsRecords(activeDomain.value.records) : []))
const canSaveDomain = computed(() => form.domain.trim().length > 0 && form.hostname.trim().length > 0 && form.noreplyAddress.trim().length > 0)

async function saveStepOne() {
  if (busy.value || !canSaveDomain.value) return
  busy.value = true
  error.value = ''
  try {
    const cleanDomain = form.domain.trim().toLowerCase()
    await updateMailSettings({
      hostname: form.hostname.trim(),
      noreplyAddress: form.noreplyAddress.trim(),
      noreplyName: form.noreplyName.trim() || 'Flixer',
      inboundEnabled: form.inboundEnabled,
      outboundEnabled: form.outboundEnabled,
    })
    const existing = props.existingDomains?.find((item) => item.domain.toLowerCase() === cleanDomain)
    activeDomain.value = existing ?? (await createMailDomain({ domain: cleanDomain, allowSubdomains: form.allowSubdomains }))
    step.value = 'dns'
  } catch (err) {
    error.value = describeRequestError(err, t('admin.mail.saveFailed'))
  } finally {
    busy.value = false
  }
}

async function verifyDns() {
  if (!activeDomain.value || busy.value) return
  busy.value = true
  error.value = ''
  try {
    activeDomain.value = await verifyMailDomain(activeDomain.value.id)
    if (activeDomain.value.verified) notify.success(t('admin.mail.domainVerified'))
  } catch (err) {
    error.value = describeRequestError(err, t('admin.mail.verifyFailed'))
  } finally {
    busy.value = false
  }
}

async function exportToCloudflare() {
  if (!activeDomain.value) return
  const zone = downloadCloudflareZoneFile(activeDomain.value)
  await copyToClipboard(zone)
  notify.success(t('admin.mail.cloudflareExported'))
}

async function runChecks() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    diagnostics.value = await runMailDiagnostics()
  } catch (err) {
    error.value = describeRequestError(err, t('admin.mail.diagnosticsFailed'))
  } finally {
    busy.value = false
  }
}

async function sendTest() {
  if (busy.value || !testEmail.value.trim()) return
  busy.value = true
  error.value = ''
  try {
    await sendMailTemplateTest('verify-email', testEmail.value.trim())
    notify.success(t('admin.mail.setup.testSent', { email: testEmail.value.trim() }))
  } catch (err) {
    error.value = describeRequestError(err, t('admin.mail.setup.testFailed'))
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col rounded border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <header class="flixer-modal-header">
        <ModalTitle class="text-lg font-semibold text-white">{{ t('admin.mail.setup.title') }}</ModalTitle>
        <ModalDescription class="mt-1 text-sm text-flixer-muted">{{ t('admin.mail.setup.subtitle') }}</ModalDescription>
        <div class="mt-3 flex flex-wrap gap-2 text-xs">
          <span class="rounded px-2.5 py-1 font-semibold" :class="step === 'domain' ? 'bg-flixer-primary text-white' : 'bg-white/5 text-flixer-muted'">{{ t('admin.mail.setup.stepDomain') }}</span>
          <span class="rounded px-2.5 py-1 font-semibold" :class="step === 'dns' ? 'bg-flixer-primary text-white' : 'bg-white/5 text-flixer-muted'">{{ t('admin.mail.setup.stepDns') }}</span>
          <span class="rounded px-2.5 py-1 font-semibold" :class="step === 'test' ? 'bg-flixer-primary text-white' : 'bg-white/5 text-flixer-muted'">{{ t('admin.mail.setup.stepTest') }}</span>
        </div>
      </header>

      <div class="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        <template v-if="step === 'domain'">
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="text-xs text-flixer-muted sm:col-span-2">
              {{ t('admin.mail.domainName') }}
              <input v-model="form.domain" :class="inputClass" :placeholder="t('admin.mail.setup.domainPlaceholder')" />
            </label>
            <label class="text-xs text-flixer-muted">
              {{ t('admin.mail.hostname') }}
              <input v-model="form.hostname" :class="inputClass" placeholder="mail.example.com" @input="hostnameTouched = true" />
            </label>
            <label class="text-xs text-flixer-muted">
              {{ t('admin.mail.noreplyAddress') }}
              <input v-model="form.noreplyAddress" :class="inputClass" placeholder="noreply@example.com" @input="noreplyTouched = true" />
            </label>
            <label class="text-xs text-flixer-muted sm:col-span-2">
              {{ t('admin.mail.senderName') }}
              <input v-model="form.noreplyName" :class="inputClass" />
            </label>
          </div>
          <div class="grid gap-2 sm:grid-cols-3">
            <AdminToggle v-model="form.allowSubdomains" :label="t('admin.mail.allowSubdomains')" />
            <AdminToggle v-model="form.inboundEnabled" :label="t('admin.mail.inboundEnabled')" />
            <AdminToggle v-model="form.outboundEnabled" :label="t('admin.mail.outboundEnabled')" />
          </div>
        </template>

        <template v-else-if="step === 'dns'">
          <p class="text-xs text-flixer-muted">{{ t('admin.mail.setup.dnsDescription') }}</p>
          <div class="flex flex-wrap items-center justify-between gap-2 rounded border border-flixer-accent/30 bg-flixer-primary/10 p-3">
            <p class="max-w-md text-xs text-flixer-text">{{ t('admin.mail.setup.cloudflareHint') }}</p>
            <Button type="button" :class="primaryButtonClass" @click="exportToCloudflare">
              {{ t('admin.mail.importToCloudflare') }}
            </Button>
          </div>
          <div v-if="activeDomain?.checks && Object.keys(activeDomain.checks).length" class="flex flex-wrap gap-2">
            <span v-for="(check, name) in activeDomain.checks" :key="name" class="rounded px-2 py-1 text-[11px]" :class="check.ok ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-200'">
              {{ t(`admin.mail.dns.${name}`, name) }} · {{ check.ok ? t('admin.mail.pass') : t('admin.mail.fail') }}
            </span>
          </div>
          <div class="max-h-60 overflow-auto rounded border border-flixer-border">
            <table class="w-full text-left text-xs">
              <thead class="bg-black/20 text-flixer-muted">
                <tr>
                  <th class="px-2 py-2">{{ t('admin.mail.dnsType') }}</th>
                  <th class="px-2 py-2">{{ t('admin.mail.dnsName') }}</th>
                  <th class="px-2 py-2">{{ t('admin.mail.dnsValue') }}</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="group in dnsGroups" :key="group.purpose">
                  <tr v-for="record in group.records" :key="`${record.purpose}-${record.name}`" class="border-t border-flixer-border/50 align-top">
                    <td class="px-2 py-2 font-semibold text-white">{{ record.type }}</td>
                    <td class="break-all px-2 py-2 font-mono text-flixer-text">{{ record.name }}</td>
                    <td class="break-all px-2 py-2 font-mono text-flixer-text"><span v-if="record.priority" class="mr-1 text-flixer-muted">{{ record.priority }}</span>{{ record.value }}</td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
          <div class="flex items-center justify-between gap-2">
            <StatusPill v-if="activeDomain" :tone="activeDomain.verified ? 'good' : 'warn'">{{ activeDomain.verified ? t('admin.mail.verified') : t('admin.mail.unverified') }}</StatusPill>
            <Button type="button" :class="secondaryButtonClass" :disabled="busy" @click="verifyDns">{{ t('admin.mail.verify') }}</Button>
          </div>
        </template>

        <template v-else-if="step === 'test'">
          <p class="text-xs text-flixer-muted">{{ t('admin.mail.setup.testDescription') }}</p>
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-semibold text-white">{{ t('admin.mail.diagnosticsResults') }}</span>
            <Button type="button" :class="secondaryButtonClass" :disabled="busy" @click="runChecks">{{ t('admin.mail.runDiagnostics') }}</Button>
          </div>
          <ul v-if="diagnostics" class="grid gap-2 sm:grid-cols-2">
            <li v-for="(check, name) in diagnostics" :key="name" class="rounded border border-flixer-border/70 bg-black/10 p-3">
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs font-semibold text-white">{{ t(`admin.mail.diagnostic.${name}`, name) }}</span>
                <StatusPill :tone="check.ok ? 'good' : 'bad'">{{ check.ok ? t('admin.mail.pass') : t('admin.mail.fail') }}</StatusPill>
              </div>
              <p class="mt-1 text-xs text-flixer-muted">{{ check.detail }}</p>
            </li>
          </ul>
          <div class="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
            <label class="text-xs text-flixer-muted">
              {{ t('admin.mail.setup.testEmailLabel') }}
              <input v-model="testEmail" type="email" :class="inputClass" placeholder="you@example.com" />
            </label>
            <Button type="button" :class="primaryButtonClass" :disabled="busy || !testEmail.trim()" @click="sendTest">{{ t('admin.mail.setup.sendTest') }}</Button>
          </div>
        </template>

        <p v-if="error" class="rounded border border-red-400/30 bg-red-500/10 p-3 text-xs text-red-200" role="alert">{{ error }}</p>
      </div>

      <footer class="flixer-modal-actions mt-5 flex flex-wrap items-center justify-between gap-2">
        <Button type="button" :class="secondaryButtonClass" @click="close()">{{ t('common.cancel') }}</Button>
        <div class="flex gap-2">
          <Button v-if="step !== 'domain'" type="button" :class="secondaryButtonClass" :disabled="busy" @click="step = step === 'test' ? 'dns' : 'domain'">{{ t('admin.mail.setup.back') }}</Button>
          <Button v-if="step === 'domain'" type="button" :class="primaryButtonClass" :disabled="busy || !canSaveDomain" @click="saveStepOne">{{ t('admin.mail.setup.saveAndContinue') }}</Button>
          <Button v-else-if="step === 'dns'" type="button" :class="primaryButtonClass" :disabled="busy" @click="step = 'test'">{{ t('admin.mail.setup.next') }}</Button>
          <Button v-else type="button" :class="primaryButtonClass" :disabled="busy" @click="confirm(true)">{{ t('admin.mail.setup.finish') }}</Button>
        </div>
      </footer>
    </ModalContent>
  </ModalRoot>
</template>
