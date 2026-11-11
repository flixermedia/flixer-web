<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { linkExternalDirectory, listExternalAuthProviders, listLinkedExternalProviders, unlinkExternalProvider, type ExternalAuthProvider } from '../../api'
import { beginExternalOAuth } from '../../composables/externalOAuth'
import { notify } from '../../composables/notify'
import { requestPassword } from '../../composables/requestPassword'
import { isNativeApp } from '../../platform/serverConnection'

const { t } = useI18n()
const providers = ref<ExternalAuthProvider[]>([])
const linked = ref<string[]>([])
const selected = ref<ExternalAuthProvider | null>(null)
const username = ref('')
const password = ref('')
const busy = ref(false)

async function load() {
    try {
        const [available, identities] = await Promise.all([listExternalAuthProviders(), listLinkedExternalProviders()])
        providers.value = [...available.filter((provider) => !isNativeApp() || provider.type === 'directory'), ...identities.filter((id) => !available.some((provider) => provider.id === id)).map((id) => ({ id, name: id, type: 'directory' as const }))]
        linked.value = identities
    } catch { notify.error(t('externalAuth.error')) }
}

async function confirmPassword() {
    return requestPassword({ title: t('externalAuth.title'), description: t('externalAuth.localPasswordPrompt'), passwordLabel: t('externalAuth.localPassword'), submitLabel: t('common.confirm') })
}

async function link(provider: ExternalAuthProvider) {
    if (busy.value) return
    if (provider.type === 'directory') { selected.value = provider; return }
    busy.value = true
    try {
        const accountPassword = await confirmPassword()
        if (accountPassword) await beginExternalOAuth(provider.id, true, accountPassword)
    } catch { notify.error(t('externalAuth.error')) }
    finally { busy.value = false }
}

async function linkDirectory() {
    if (!selected.value || busy.value) return
    busy.value = true
    try {
        const accountPassword = await confirmPassword()
        if (!accountPassword) return
        await linkExternalDirectory(selected.value.id, username.value, password.value, accountPassword)
        selected.value = null
        username.value = ''
        notify.success(t('externalAuth.linkedSuccess'))
        await load()
    } catch { notify.error(t('externalAuth.error')) }
    finally { password.value = ''; busy.value = false }
}

async function unlink(provider: ExternalAuthProvider) {
    if (busy.value) return
    busy.value = true
    try {
        const accountPassword = await confirmPassword()
        if (!accountPassword) return
        await unlinkExternalProvider(provider.id, accountPassword)
        notify.success(t('externalAuth.unlinkedSuccess'))
        await load()
    } catch { notify.error(t('externalAuth.error')) }
    finally { busy.value = false }
}

onMounted(load)
</script>

<template>
    <section v-if="providers.length" class="lg:col-span-2" aria-labelledby="external-providers-heading">
        <h2 id="external-providers-heading" class="text-lg font-semibold">{{ t('externalAuth.title') }}</h2>
        <ul class="mt-4 divide-y divide-flixer-border border-y border-flixer-border">
            <li v-for="provider in providers" :key="`${provider.id}:${provider.type}`"
                class="flex flex-wrap items-center justify-between gap-3 py-3">
                <div class="min-w-0">
                    <p class="break-words text-sm font-medium">{{ provider.name }}</p>
                    <p v-if="linked.includes(provider.id)" class="text-xs text-flixer-muted">{{ t('externalAuth.linked')
                        }}</p>
                </div>
                <button v-if="linked.includes(provider.id)" type="button"
                    class="rounded border border-flixer-border px-3 py-2 text-sm hover:bg-white/10 disabled:opacity-50"
                    :disabled="busy" @click="unlink(provider)">{{ t('externalAuth.unlink') }}</button>
                <button v-else type="button"
                    class="rounded border border-flixer-border px-3 py-2 text-sm hover:bg-white/10 disabled:opacity-50"
                    :disabled="busy" @click="link(provider)">{{ t('externalAuth.link') }}</button>
            </li>
        </ul>
        <form v-if="selected" class="mt-4 max-w-md space-y-3" @submit.prevent="linkDirectory">
            <label class="block text-sm text-flixer-muted">{{ t('externalAuth.username') }}<input
                    v-model.trim="username" type="text" autocomplete="username" maxlength="254" required
                    class="mt-1 h-11 w-full rounded border border-flixer-border bg-flixer-background px-3 text-flixer-text" /></label>
            <label class="block text-sm text-flixer-muted">{{ t('externalAuth.password') }}<input v-model="password"
                    type="password" autocomplete="current-password" maxlength="1024" required
                    class="mt-1 h-11 w-full rounded border border-flixer-border bg-flixer-background px-3 text-flixer-text" /></label>
            <div class="flex gap-2"><button type="submit" :disabled="busy"
                    class="rounded bg-white px-4 py-2 text-sm font-semibold text-flixer-background disabled:opacity-50">{{
                        t('externalAuth.link') }}</button><button type="button"
                    class="rounded px-4 py-2 text-sm text-flixer-muted hover:text-white"
                    @click="selected = null; password = ''">{{ t('common.cancel') }}</button></div>
        </form>
    </section>
</template>