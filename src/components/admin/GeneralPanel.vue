<script setup lang="ts">
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminSection from './AdminSection.vue'
import AdminToggle from './AdminToggle.vue'
import { serverInfo } from './mock'

const { t } = useI18n()

const form = reactive({
  name: serverInfo.name,
  address: serverInfo.address,
  language: 'English',
  port: 3000,
  https: true,
  remote: true,
  upnp: false,
  lanNetworks: '192.168.1.0/24',
  smtpHost: 'smtp.example.com',
  smtpPort: 587,
  smtpFrom: 'Flixer <no-reply@example.com>',
  logRetention: 30,
  notifyNewUser: true,
  notifyTaskFail: true,
  quickConnect: true,
  banner: '',
})
const inputClass = 'mt-1 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-flixer-text'
const save = 'rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80'
</script>

<template>
  <div class="flex flex-col gap-6">
    <AdminSection :title="t('admin.general.title')" :description="t('admin.general.description')">
      <template #actions
        ><button type="button" :class="save">{{ t('common.save') }}</button></template
      >
      <div class="grid gap-4 md:grid-cols-2">
        <label class="text-xs text-flixer-muted">{{ t('admin.general.serverName') }}<input v-model="form.name" :class="inputClass" /></label>
        <label class="text-xs text-flixer-muted">
          {{ t('admin.general.displayLanguage') }}
          <select v-model="form.language" :class="inputClass">
            <option value="English">{{ t('admin.general.languageEnglish') }}</option>
            <option value="Deutsch">{{ t('admin.general.languageGerman') }}</option>
            <option value="Français">{{ t('admin.general.languageFrench') }}</option>
          </select>
        </label>
        <label class="text-xs text-flixer-muted md:col-span-2">{{ t('admin.general.loginBanner') }}<textarea v-model="form.banner" rows="2" :class="inputClass" :placeholder="t('admin.general.loginBannerPlaceholder')"></textarea></label>
        <label class="text-xs text-flixer-muted">{{ t('admin.general.logRetention') }}<input v-model.number="form.logRetention" type="number" min="1" :class="inputClass" /></label>
      </div>
    </AdminSection>

    <AdminSection :title="t('admin.general.networkingTitle')" :description="t('admin.general.networkingDescription')">
      <template #actions
        ><button type="button" :class="save">{{ t('common.save') }}</button></template
      >
      <div class="grid gap-4 md:grid-cols-2">
        <label class="text-xs text-flixer-muted">{{ t('admin.general.publicAddress') }}<input v-model="form.address" :class="inputClass" /></label>
        <label class="text-xs text-flixer-muted">{{ t('admin.general.httpPort') }}<input v-model.number="form.port" type="number" :class="inputClass" /></label>
        <label class="text-xs text-flixer-muted md:col-span-2">{{ t('admin.general.localNetworkRanges') }}<input v-model="form.lanNetworks" :class="[inputClass, 'font-mono']" /></label>
      </div>
      <div class="mt-3 grid gap-x-8 md:grid-cols-2">
        <AdminToggle v-model="form.https" :label="t('admin.general.requireHttps')" />
        <AdminToggle v-model="form.remote" :label="t('admin.general.allowRemoteConnections')" />
        <AdminToggle v-model="form.upnp" :label="t('admin.general.automaticPortMapping')" />
      </div>
    </AdminSection>

    <AdminSection :title="t('admin.general.emailTitle')" :description="t('admin.general.emailDescription')">
      <template #actions>
        <button type="button" class="rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15">{{ t('admin.general.sendTestEmail') }}</button>
        <button type="button" :class="save">{{ t('common.save') }}</button>
      </template>
      <div class="grid gap-4 md:grid-cols-3">
        <label class="text-xs text-flixer-muted">{{ t('admin.general.smtpHost') }}<input v-model="form.smtpHost" :class="inputClass" /></label>
        <label class="text-xs text-flixer-muted">{{ t('admin.general.smtpPort') }}<input v-model.number="form.smtpPort" type="number" :class="inputClass" /></label>
        <label class="text-xs text-flixer-muted">{{ t('admin.general.fromAddress') }}<input v-model="form.smtpFrom" :class="inputClass" /></label>
      </div>
    </AdminSection>

    <AdminSection :title="t('admin.general.notificationsTitle')" :description="t('admin.general.notificationsDescription')">
      <AdminToggle v-model="form.notifyNewUser" :label="t('admin.general.newUserAwaitingApproval')" />
      <AdminToggle v-model="form.notifyTaskFail" :label="t('admin.general.scheduledTaskFailed')" />
      <AdminToggle v-model="form.quickConnect" :label="t('admin.general.allowQuickConnect')" :description="t('admin.general.quickConnectDescription')" />
    </AdminSection>

    <AdminSection :title="t('admin.general.dangerZoneTitle')" :description="t('admin.general.dangerZoneDescription')">
      <div class="flex flex-wrap gap-2">
        <button type="button" class="rounded bg-red-500/20 px-4 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/30">{{ t('admin.general.clearMetadataCache') }}</button>
        <button type="button" class="rounded bg-red-500/20 px-4 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/30">{{ t('admin.general.resetPlaybackHistory') }}</button>
      </div>
    </AdminSection>
  </div>
</template>
