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
    <div v-if="providers.length" :class="selected ? '' : 'mt-4 border-t border-flixer-border/70 pt-4'">
        <h1 v-if="selected" id="login-title" class="text-2xl font-semibold tracking-tight text-flixer-text">
            {{ t('externalAuth.signInWith', { name: selected.name }) }}
        </h1>
        <h2 v-else class="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-flixer-muted/80">
            {{ t('externalAuth.title') }}
        </h2>
        <div v-if="!selected" class="grid gap-2" :class="providers.length > 1 ? 'sm:grid-cols-2' : 'grid-cols-1'">
            <button v-for="provider in providers" :key="`${provider.id}:${provider.type}`" type="button"
                class="flex h-10 items-center justify-center gap-2 rounded border border-flixer-border bg-flixer-background/60 px-3 text-xs font-medium text-flixer-text transition hover:border-flixer-accent/50 hover:bg-flixer-surface disabled:opacity-50"
                :disabled="busy" @click="select(provider)">
                <Icon icon="lucide:log-in" class="size-3.5 shrink-0 text-flixer-muted" aria-hidden="true" />
                <span class="truncate">{{ t('externalAuth.signInWith', { name: provider.name }) }}</span>
            </button>
        </div>
        <form v-else class="mt-4 space-y-3.5" @submit.prevent="signIn">
            <label class="block text-xs font-medium text-flixer-text/85">
                {{ t('externalAuth.username') }}
                <input v-model.trim="username" type="text" autocomplete="username" maxlength="254" required
                    class="mt-1.5 h-11 w-full rounded border border-flixer-border bg-flixer-background/70 px-3 text-sm text-flixer-text outline-none focus:border-flixer-accent focus:ring-2 focus:ring-flixer-accent/15" />
            </label>
            <label class="block text-xs font-medium text-flixer-text/85">
                {{ t('externalAuth.password') }}
                <input v-model="password" type="password" autocomplete="current-password" maxlength="1024" required
                    class="mt-1.5 h-11 w-full rounded border border-flixer-border bg-flixer-background/70 px-3 text-sm text-flixer-text outline-none focus:border-flixer-accent focus:ring-2 focus:ring-flixer-accent/15" />
            </label>
            <div class="flex gap-2 pt-1">
                <button type="submit" :disabled="busy"
                    class="h-10 rounded bg-flixer-primary px-4 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-50">
                    {{ t('externalAuth.signIn') }}
                </button>
                <button type="button"
                    class="h-10 rounded border border-flixer-border px-4 text-xs font-medium text-flixer-muted transition hover:text-flixer-text"
                    @click="selected = null; password = ''; emit('selection', false)">
                    {{ t('common.cancel') }}
                </button>
            </div>
        </form>
    </div>
</template>
