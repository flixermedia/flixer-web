<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { createOidcClient, deleteOidcClient, getOidcConfiguration, listOidcClients, setOidcResourceScopes, updateOidcConfiguration, type OidcClient } from '../../api/oidc'
import { confirmAction } from '../../composables/confirm'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import AdminSection from './AdminSection.vue'

const { t } = useI18n()
const clients = ref<OidcClient[]>([])
const issuer = ref('')
const publicUrl = ref('')
const configuredUrl = ref('')
const configurationLoaded = ref(false)
const savingConfiguration = ref(false)
const error = ref('')
const name = ref('')
const redirects = ref('')
const type = ref<'public' | 'confidential'>('confidential')
const created = ref<(OidcClient & { secret?: string }) | null>(null)
const busy = ref(false)
const changingClient = ref('')
const resourceScopes = ['subscriptions:read', 'entitlements:read', 'purchases:read', 'access:check', 'library:read', 'favorites:read', 'playlists:read', 'progress:read', 'history:read', 'preferences:read'] as const

async function load(loadConfiguration = false) {
  const [clientsError, list] = await catchError(listOidcClients())
  if (clientsError) error.value = describeRequestError(clientsError, t('oidc.admin.loadError'))
  else { clients.value = list; error.value = '' }
  if (!loadConfiguration) return
  const [configError, config] = await catchError(getOidcConfiguration())
  if (configError) error.value = describeRequestError(configError, t('oidc.admin.loadError'))
  else {
    issuer.value = config.issuer
    configuredUrl.value = config.publicUrl
    publicUrl.value = config.publicUrl || window.location.origin
    configurationLoaded.value = true
  }
}

async function saveConfiguration() {
  if (savingConfiguration.value) return
  if (configuredUrl.value && publicUrl.value !== configuredUrl.value &&
      !(await confirmAction(t('oidc.admin.confirmUrlChange'), { danger: true }))) return
  savingConfiguration.value = true
  const [failure, result] = await catchError(updateOidcConfiguration(publicUrl.value.trim()))
  savingConfiguration.value = false
  if (failure) { notify.error(describeRequestError(failure, t('oidc.admin.configurationError'))); return }
  publicUrl.value = result.publicUrl
  configuredUrl.value = result.publicUrl
  issuer.value = result.issuer
  notify.success(t('oidc.admin.configurationSaved'))
}

async function create() {
  if (busy.value) return
  busy.value = true
  const [failure, result] = await catchError(createOidcClient({ name: name.value, redirectUris: redirects.value.split('\n').map((value) => value.trim()).filter(Boolean), type: type.value }))
  busy.value = false
  if (failure) { notify.error(describeRequestError(failure, t('oidc.admin.createError'))); return }
  created.value = result
  name.value = ''
  redirects.value = ''
  await load()
}

async function remove(client: OidcClient) {
  if (!(await confirmAction(t('oidc.admin.confirmDelete', { name: client.name }), { danger: true }))) return
  const [failure] = await catchError(deleteOidcClient(client.id))
  if (failure) notify.error(describeRequestError(failure, t('oidc.admin.deleteError')))
  else {
    if (created.value?.id === client.id) created.value = null
    await load()
  }
}

async function changeScope(client: OidcClient, scope: string, event: Event) {
  const input = event.target as HTMLInputElement
  if (changingClient.value) { input.checked = client.resourceScopes.includes(scope); return }
  const enabled = input.checked
  changingClient.value = client.id
  if (!enabled && !(await confirmAction(t('oidc.admin.disableScopeConfirm', { name: client.name }), { danger: true }))) {
    input.checked = true
    changingClient.value = ''
    return
  }
  const scopes = enabled ? [...client.resourceScopes, scope] : client.resourceScopes.filter((value) => value !== scope)
  const [failure] = await catchError(setOidcResourceScopes(client.id, scopes))
  changingClient.value = ''
  if (failure) {
    input.checked = !enabled
    notify.error(describeRequestError(failure, t('oidc.admin.scopeError')))
  } else {
    client.resourceScopes = scopes
    notify.success(t('oidc.admin.scopeSaved'))
  }
}

onMounted(() => void load(true))
</script>

<template>
  <AdminSection :title="t('oidc.admin.title')" :description="t('oidc.admin.description')">
    <p v-if="error" class="mb-4 text-sm text-red-300" role="alert">{{ error }}</p>
    <form class="mb-5 grid gap-3" @submit.prevent="saveConfiguration">
      <label class="text-sm">{{ t('oidc.admin.publicUrl') }}<input v-model="publicUrl" type="url" required maxlength="2048" class="mt-1 block w-full rounded border border-flixer-border bg-flixer-background px-3 py-2" /></label>
      <p class="text-xs text-flixer-muted">{{ t('oidc.admin.publicUrlHint') }}</p>
      <button type="submit" class="w-fit rounded border border-flixer-border px-4 py-2 text-sm font-semibold disabled:opacity-50" :disabled="savingConfiguration || !configurationLoaded">{{ t('common.save') }}</button>
    </form>
    <p v-if="issuer" class="mb-4 break-all text-sm text-flixer-muted">{{ t('oidc.admin.issuer') }}: <code>{{ issuer }}</code></p>
    <div v-if="created" class="mb-5 rounded border border-flixer-accent/30 bg-flixer-primary/10 p-4 text-sm">
      <p class="font-semibold">{{ t('oidc.admin.created') }}</p>
      <p class="mt-2 break-all">{{ t('oidc.admin.clientId') }}: <code>{{ created.id }}</code></p>
      <template v-if="created.secret">
        <p class="mt-2">{{ t('oidc.admin.secretWarning') }}</p>
        <p class="mt-2 break-all"><code>{{ created.secret }}</code></p>
      </template>
      <button type="button" class="mt-3 underline" @click="created = null">{{ t('common.close') }}</button>
    </div>
    <form class="grid gap-3" @submit.prevent="create">
      <label class="text-sm">{{ t('oidc.admin.name') }}<input v-model="name" required maxlength="100" class="mt-1 block w-full rounded border border-flixer-border bg-flixer-background px-3 py-2" /></label>
      <label class="text-sm">{{ t('oidc.admin.redirectUris') }}<textarea v-model="redirects" required rows="3" class="mt-1 block w-full rounded border border-flixer-border bg-flixer-background px-3 py-2" /></label>
      <p class="text-xs text-flixer-muted">{{ t('oidc.admin.redirectHint') }}</p>
      <label class="text-sm">{{ t('oidc.admin.type') }}<select v-model="type" class="mt-1 block w-full rounded border border-flixer-border bg-flixer-background px-3 py-2"><option value="confidential">{{ t('oidc.admin.confidential') }}</option><option value="public">{{ t('oidc.admin.public') }}</option></select></label>
      <button type="submit" class="w-fit rounded bg-flixer-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" :disabled="busy || !issuer">{{ t('oidc.admin.create') }}</button>
    </form>
    <ul class="mt-6 divide-y divide-flixer-border">
      <li v-for="client in clients" :key="client.id" class="flex flex-wrap items-start justify-between gap-3 py-3 text-sm">
        <div class="min-w-0"><p class="font-semibold">{{ client.name }}</p><p class="break-all font-mono text-xs text-flixer-muted">{{ client.id }}</p><p v-for="uri in client.redirectUris" :key="uri" class="break-all text-xs text-flixer-muted">{{ uri }}</p><fieldset class="mt-4"><legend class="font-semibold">{{ t('oidc.admin.resourcePermissions') }}</legend><p class="mt-1 text-xs text-flixer-muted">{{ t('oidc.admin.resourcePermissionsHint') }}</p><label v-for="scope in resourceScopes" :key="scope" class="mt-2 flex items-center gap-2"><input type="checkbox" :checked="client.resourceScopes.includes(scope)" :disabled="changingClient !== ''" @change="changeScope(client, scope, $event)" />{{ t(`oidc.scopes.${scope}`) }}</label></fieldset></div>
        <button type="button" class="text-red-300 underline" @click="remove(client)">{{ t('oidc.admin.delete') }}</button>
      </li>
    </ul>
  </AdminSection>
</template>
