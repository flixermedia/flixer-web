<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { externalDirectoryLogin, listExternalAuthProviders, type ExternalAuthProvider, type ExternalAuthResult } from '../../api'
import { beginExternalOAuth } from '../../composables/externalOAuth'
import { notify } from '../../composables/notify'
import { isNativeApp } from '../../platform/serverConnection'

const props = defineProps<{ redirect?: string }>()
const emit = defineEmits<{ authenticated: [result: ExternalAuthResult]; selection: [active: boolean] }>()
const { t } = useI18n()
const providers = ref<ExternalAuthProvider[]>([])
const selected = ref<ExternalAuthProvider | null>(null)
const username = ref('')
const password = ref('')
const busy = ref(false)

onMounted(async () => {
    try { providers.value = (await listExternalAuthProviders()).filter((provider) => !isNativeApp() || provider.type === 'directory') } catch { providers.value = [] }
})

async function select(provider: ExternalAuthProvider) {
    if (busy.value) return
    if (provider.type === 'directory') { selected.value = provider; emit('selection', true); return }
    busy.value = true
    try { await beginExternalOAuth(provider.id, false, undefined, props.redirect) } catch { notify.error(t('externalAuth.error')); busy.value = false }
}

async function signIn() {
    if (!selected.value || busy.value) return
    busy.value = true
    try { emit('authenticated', await externalDirectoryLogin(selected.value.id, username.value, password.value)) }
    catch { notify.error(t('externalAuth.error')) }
    finally { password.value = ''; busy.value = false }
}
</script>

<template>
    <div v-if="providers.length" :class="selected ? '' : 'mt-5 border-t border-flixer-border pt-5'">
        <h1 v-if="selected" id="login-title" class="text-2xl font-semibold text-flixer-text">{{
            t('externalAuth.signInWith', { name: selected.name }) }}</h1>
        <h2 v-else class="text-sm font-semibold text-flixer-text">{{ t('externalAuth.title') }}</h2>
        <div v-if="!selected" class="mt-3 flex flex-col gap-2">
            <button v-for="provider in providers" :key="`${provider.id}:${provider.type}`" type="button"
                class="flex min-h-11 items-center gap-2 rounded border border-flixer-border px-3 text-left text-sm text-flixer-text hover:bg-white/10 disabled:opacity-50"
                :disabled="busy" @click="select(provider)">
                <Icon icon="lucide:log-in" class="size-4 shrink-0" aria-hidden="true" />{{ t('externalAuth.signInWith',
                    { name: provider.name }) }}
            </button>
            <p class="text-xs leading-relaxed text-flixer-muted">{{ t('externalAuth.linkAccountHint') }}</p>
        </div>
        <form v-else class="mt-3 space-y-3" @submit.prevent="signIn">
            <label class="block text-sm text-flixer-muted">{{ t('externalAuth.username') }}<input
                    v-model.trim="username" type="text" autocomplete="username" maxlength="254" required
                    class="mt-1 h-11 w-full rounded border border-flixer-border bg-flixer-background px-3 text-flixer-text" /></label>
            <label class="block text-sm text-flixer-muted">{{ t('externalAuth.password') }}<input v-model="password"
                    type="password" autocomplete="current-password" maxlength="1024" required
                    class="mt-1 h-11 w-full rounded border border-flixer-border bg-flixer-background px-3 text-flixer-text" /></label>
            <div class="flex gap-2"><button type="submit" :disabled="busy"
                    class="rounded bg-white px-4 py-2 text-sm font-semibold text-flixer-background disabled:opacity-50">{{
                        t('externalAuth.signIn') }}</button><button type="button"
                    class="rounded px-4 py-2 text-sm text-flixer-muted hover:text-white"
                    @click="selected = null; password = ''; emit('selection', false)">{{ t('common.cancel') }}</button>
            </div>
        </form>
    </div>
</template>