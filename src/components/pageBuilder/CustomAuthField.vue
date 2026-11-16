<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { browserSupportsWebAuthn } from '@simplewebauthn/browser'
import { Icon } from '@iconify/vue'
import type { AuthField } from './pageBuilder'

const props = defineProps<{ field: AuthField; registration: boolean; registrationEnabled: boolean | null; quickConnectEnabled: boolean; submitting: boolean; needsVerification: boolean; resending: boolean; modelValue: { username: string; password: string; email: string; displayName: string } }>()
const emit = defineEmits<{ 'update:modelValue': [value: typeof props.modelValue]; switch: []; passkey: []; quickConnect: []; resend: [] }>()
const { t } = useI18n()
const passkeysSupported = browserSupportsWebAuthn()
function update(name: 'username' | 'password' | 'email' | 'displayName', event: Event) {
    emit('update:modelValue', { ...props.modelValue, [name]: (event.target as HTMLInputElement).value })
}
const input = 'mt-2 h-12 w-full rounded border border-flixer-border bg-flixer-background/90 px-4 text-flixer-text outline-none focus:border-flixer-accent'
const button = 'flex min-h-12 w-full items-center justify-center gap-2 rounded border border-flixer-border bg-flixer-surface px-4 py-2 text-sm font-semibold text-flixer-text focus-visible:outline-2 focus-visible:outline-flixer-accent disabled:opacity-50'
</script>

<template>
    <label v-if="field === 'username'" class="block text-sm font-semibold">{{ t('auth.username') }}<input
            form="custom-auth-form" :value="modelValue.username" type="text" autocomplete="username"
            autocapitalize="none" autocorrect="off" spellcheck="false" minlength="3" maxlength="64"
            pattern="[a-zA-Z0-9_.\-]+" required :disabled="registration && registrationEnabled !== true" :class="input"
            @input="update('username', $event)" /></label>
    <label v-else-if="field === 'password'" class="block text-sm font-semibold">{{ t('auth.password') }}<input
            form="custom-auth-form" :value="modelValue.password" type="password"
            :autocomplete="registration ? 'new-password' : 'current-password'" :minlength="registration ? 8 : undefined"
            maxlength="128" required :disabled="registration && registrationEnabled !== true" :class="input"
            @input="update('password', $event)" /></label>
    <label v-else-if="field === 'email' && registration" class="block text-sm font-semibold">{{ t('auth.email') }}<input
            form="custom-auth-form" :value="modelValue.email" type="email" autocomplete="email" maxlength="254" required
            :disabled="registrationEnabled !== true" :class="input" @input="update('email', $event)" /></label>
    <label v-else-if="field === 'displayName' && registration" class="block text-sm font-semibold">{{
        t('auth.displayName') }}<input form="custom-auth-form" :value="modelValue.displayName" type="text"
            autocomplete="nickname" maxlength="64" :disabled="registrationEnabled !== true" :class="input"
            @input="update('displayName', $event)" /></label>
    <button v-else-if="field === 'submit'" form="custom-auth-form" type="submit"
        :disabled="submitting || (registration && registrationEnabled !== true)" :class="button"
        class="border-transparent bg-flixer-primary text-white">{{ submitting ? t(registration ? 'auth.creatingAccount'
            : 'auth.signingIn') : t(registration ? 'auth.createAccount' : 'auth.signInToFlixer') }}</button>
    <button v-else-if="field === 'switch' && (registration || registrationEnabled === true)" type="button"
        :class="button" @click="emit('switch')">{{ t(registration ? 'auth.backToSignIn' : 'auth.createYourAccount')
        }}</button>
    <button v-else-if="field === 'passkey' && !registration && passkeysSupported" type="button" :disabled="submitting"
        :class="button" @click="emit('passkey')">
        <Icon icon="lucide:key-round" class="size-4" />{{ t('auth.signInWithPasskey') }}
    </button>
    <button v-else-if="field === 'quickConnect' && !registration && quickConnectEnabled" type="button"
        :disabled="submitting" :class="button" @click="emit('quickConnect')">
        <Icon icon="lucide:monitor-smartphone" class="size-4" />{{ t('auth.quickConnectSignIn') }}
    </button>
    <button v-else-if="field === 'resend' && !registration && needsVerification" type="button" :disabled="resending"
        :class="button" @click="emit('resend')">{{ t(resending ? 'auth.sending' : 'auth.resendVerification') }}</button>
</template>