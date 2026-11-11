<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { deleteOAuthProvider, getOAuthCallbackUrl, listOAuthProviders, saveOAuthProvider, type OAuthProviderProfile, type OAuthProviderSettings } from '../../api'
import { confirmAction } from '../../composables/confirm'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import AdminSection from './AdminSection.vue'

const props = defineProps<{ pluginId: string; title: string }>()
const { t } = useI18n()
const providers = ref<OAuthProviderProfile[]>([])
const loading = ref(true)
const busy = ref(false)
const editing = ref(false)
const selectedId = ref<string | null>(null)
const hasSecret = ref(false)
const name = ref('')
const enabled = ref(false)
const clientSecret = ref('')
const settings = ref<OAuthProviderSettings>(emptySettings())
const callbackUrl = ref('')
const inputClass = 'w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm outline-none focus:border-flixer-accent'
const buttonClass = 'rounded bg-flixer-primary px-4 py-2 text-sm font-semibold text-white hover:bg-flixer-primary/80 disabled:opacity-60'
const quietButtonClass = 'rounded border border-flixer-border px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-60'

function emptySettings(): OAuthProviderSettings {
    return { authorizationUrl: '', tokenUrl: '', userInfoUrl: '', issuer: '', subjectField: 'sub', scope: '', clientId: '', tokenAuthMethod: 'client_secret_post' }
}

async function load() {
    loading.value = true
    const [error, result] = await catchError(Promise.all([listOAuthProviders(props.pluginId), getOAuthCallbackUrl(props.pluginId)]))
    if (error) notify.error(describeRequestError(error))
    else[providers.value, callbackUrl.value] = result
    loading.value = false
}

function edit(provider?: OAuthProviderProfile) {
    selectedId.value = provider?.id ?? null
    name.value = provider?.name ?? ''
    enabled.value = provider?.enabled ?? false
    settings.value = provider ? { ...provider.settings } : emptySettings()
    hasSecret.value = provider?.hasClientSecret ?? false
    clientSecret.value = ''
    editing.value = true
}

async function save() {
    busy.value = true
    try {
        const [error] = await catchError(saveOAuthProvider(props.pluginId, selectedId.value, {
            name: name.value, enabled: enabled.value, settings: { ...settings.value },
            ...(clientSecret.value ? { clientSecret: clientSecret.value } : {}),
        }))
        if (error) notify.error(describeRequestError(error))
        else {
            clientSecret.value = ''
            editing.value = false
            notify.success(t('admin.plugins.settingsSaved'))
            await load()
        }
    } finally { busy.value = false }
}

async function remove(provider: OAuthProviderProfile) {
    if (!(await confirmAction(t('admin.oauthProviders.confirmDelete', { name: provider.name }), { danger: true }))) return
    busy.value = true
    try {
        const [error] = await catchError(deleteOAuthProvider(props.pluginId, provider.id))
        if (error) notify.error(describeRequestError(error))
        else await load()
    } finally { busy.value = false }
}

onMounted(load)
</script>

<template>
    <AdminSection :title="title">
        <p v-if="loading" class="text-sm text-flixer-muted">{{ t('common.loading') }}</p>
        <template v-else>
            <label class="grid max-w-2xl gap-1 text-sm">
                {{ t('admin.oauthProviders.callbackUrl') }}
                <input :class="inputClass" :value="callbackUrl" readonly />
            </label>
            <ul v-if="providers.length" class="mt-5 divide-y divide-flixer-border border-y border-flixer-border">
                <li v-for="provider in providers" :key="provider.id"
                    class="flex items-center justify-between gap-4 py-3">
                    <div class="min-w-0">
                        <p class="break-words font-medium">{{ provider.name }}</p>
                        <p class="text-xs text-flixer-muted">{{ provider.enabled ? t('admin.oauthProviders.enabled') :
                            t('admin.oauthProviders.disabled') }}</p>
                    </div>
                    <div class="flex gap-2">
                        <button type="button" :class="quietButtonClass" :title="t('admin.oauthProviders.edit')"
                            :aria-label="t('admin.oauthProviders.edit')" :disabled="busy" @click="edit(provider)">
                            <Icon icon="lucide:pencil" class="size-4" />
                        </button>
                        <button type="button" :class="quietButtonClass" :title="t('admin.oauthProviders.delete')"
                            :aria-label="t('admin.oauthProviders.delete')" :disabled="busy" @click="remove(provider)">
                            <Icon icon="lucide:trash-2" class="size-4" />
                        </button>
                    </div>
                </li>
            </ul>
            <button v-if="!editing" type="button" :class="buttonClass" class="mt-4" :disabled="busy" @click="edit()">{{
                t('admin.oauthProviders.add') }}</button>
            <form v-else class="mt-5 grid gap-4 md:grid-cols-2" @submit.prevent="save">
                <label class="grid gap-1 text-sm">{{ t('admin.oauthProviders.name') }}<input v-model.trim="name"
                        :class="inputClass" required maxlength="128" /></label>
                <label class="grid gap-1 text-sm">{{ t('admin.oauthProviders.clientId') }}<input
                        v-model.trim="settings.clientId" :class="inputClass" required maxlength="256"
                        autocomplete="off" /></label>
                <label class="grid gap-1 text-sm">{{ t('admin.oauthProviders.authorizationUrl') }}<input
                        v-model.trim="settings.authorizationUrl" :class="inputClass" type="url" required
                        maxlength="2048" /></label>
                <label class="grid gap-1 text-sm">{{ t('admin.oauthProviders.tokenUrl') }}<input
                        v-model.trim="settings.tokenUrl" :class="inputClass" type="url" required
                        maxlength="2048" /></label>
                <label class="grid gap-1 text-sm">{{ t('admin.oauthProviders.userInfoUrl') }}<input
                        v-model.trim="settings.userInfoUrl" :class="inputClass" type="url" required
                        maxlength="2048" /></label>
                <label class="grid gap-1 text-sm">{{ t('admin.oauthProviders.issuer') }}<input
                        v-model.trim="settings.issuer" :class="inputClass" type="url" required
                        maxlength="2048" /></label>
                <label class="grid gap-1 text-sm">{{ t('admin.oauthProviders.subjectField') }}<input
                        v-model.trim="settings.subjectField" :class="inputClass" required maxlength="128" /></label>
                <label class="grid gap-1 text-sm">{{ t('admin.oauthProviders.scope') }}<input
                        v-model.trim="settings.scope" :class="inputClass" required maxlength="1024" /></label>
                <label class="grid gap-1 text-sm">{{ t('admin.oauthProviders.tokenAuthMethod') }}<select
                        v-model="settings.tokenAuthMethod" :class="inputClass">
                        <option value="client_secret_post">{{ t('admin.oauthProviders.secretPost') }}</option>
                        <option value="client_secret_basic">{{ t('admin.oauthProviders.secretBasic') }}</option>
                        <option value="none">{{ t('admin.oauthProviders.publicClient') }}</option>
                    </select></label>
                <label v-if="settings.tokenAuthMethod !== 'none'" class="grid gap-1 text-sm">{{
                    t('admin.oauthProviders.clientSecret') }}<input v-model="clientSecret" :class="inputClass"
                        type="password" autocomplete="new-password" :required="!hasSecret" maxlength="4096"
                        :placeholder="hasSecret ? t('admin.oauthProviders.secretSaved') : ''" /></label>
                <label class="flex items-center gap-2 text-sm md:col-span-2"><input v-model="enabled" type="checkbox"
                        class="h-4 w-4 accent-flixer-accent" />{{ t('admin.oauthProviders.enabled') }}</label>
                <div class="flex gap-2 md:col-span-2"><button :class="buttonClass" type="submit" :disabled="busy">{{
                        t('common.save') }}</button><button :class="quietButtonClass" type="button" :disabled="busy"
                        @click="editing = false; clientSecret = ''">{{ t('common.cancel') }}</button></div>
            </form>
        </template>
    </AdminSection>
</template>