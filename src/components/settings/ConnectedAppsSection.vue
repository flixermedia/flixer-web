<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { listConnectedApps, revokeConnectedApp, type OidcConnectedApp } from '../../api/oidc'
import { confirmAction } from '../../composables/confirm'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'

const { t, te } = useI18n()
const apps = ref<OidcConnectedApp[]>([])
const loading = ref(true)
const loadFailed = ref(false)
const busy = ref(false)

async function load() {
  loading.value = true
  const [error, result] = await catchError(listConnectedApps())
  loadFailed.value = Boolean(error)
  if (error) notify.error(describeRequestError(error, t('oidc.connected.loadError')))
  else apps.value = result
  loading.value = false
}

async function revoke(app: OidcConnectedApp) {
  if (busy.value) return
  busy.value = true
  try {
    const confirmed = await confirmAction(t('oidc.connected.confirmDescription', { name: app.name }), {
      title: t('oidc.connected.revoke'),
      confirmLabel: t('oidc.connected.confirm'),
      danger: true,
    })
    if (!confirmed) return
    const [error] = await catchError(revokeConnectedApp(app.id))
    if (error) notify.error(describeRequestError(error, t('oidc.connected.revokeError')))
    else {
      apps.value = apps.value.filter((entry) => entry.id !== app.id)
      notify.success(t('oidc.connected.revoked', { name: app.name }))
    }
  } finally {
    busy.value = false
  }
}

function scopeLabel(scope: string) {
  return te(`oidc.scopes.${scope}`, 'en') ? t(`oidc.scopes.${scope}`) : scope
}

onMounted(load)
</script>

<template>
  <section aria-labelledby="connected-apps-heading">
    <h2 id="connected-apps-heading" class="text-lg font-semibold">{{ t('oidc.connected.title') }}</h2>
    <p class="mt-1 text-sm text-flixer-muted">{{ t('oidc.connected.description') }}</p>
    <p v-if="loading" role="status" class="mt-4 text-sm text-flixer-muted">{{ t('common.loading') }}</p>
    <div v-else-if="loadFailed" role="alert" class="mt-4 space-y-2 text-sm">
      <p>{{ t('oidc.connected.loadError') }}</p>
      <button type="button" class="text-flixer-accent underline" @click="load">{{ t('oidc.retry') }}</button>
    </div>
    <p v-else-if="!apps.length" class="mt-5 rounded border border-flixer-border p-4 text-sm text-flixer-muted">{{ t('oidc.connected.empty') }}</p>
    <ul v-else class="mt-5 divide-y divide-flixer-border rounded border border-flixer-border">
      <li v-for="app in apps" :key="app.id" class="flex flex-wrap items-start justify-between gap-4 p-4">
        <div class="min-w-0">
          <h3 class="break-words font-medium">{{ app.name }}</h3>
          <p class="mt-2 text-xs font-semibold text-flixer-muted">{{ t('oidc.connected.permissions') }}</p>
          <ul class="mt-1 list-inside list-disc text-sm text-flixer-muted">
            <li v-for="scope in app.scopes" :key="scope">{{ scopeLabel(scope) }}</li>
          </ul>
        </div>
        <button type="button" class="rounded bg-red-500/20 px-3 py-2 text-sm font-semibold text-red-200 disabled:opacity-50" :disabled="busy" @click="revoke(app)">{{ t('oidc.connected.revoke') }}</button>
      </li>
    </ul>
  </section>
</template>
