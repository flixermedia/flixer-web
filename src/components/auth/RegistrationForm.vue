<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AuthField from './AuthField.vue'

defineProps<{
  isSubmitting: boolean
  registrationEnabled: boolean | null
  registrationStatusError: string
}>()

const { t } = useI18n()

const emit = defineEmits<{
  submit: [credentials: { username: string; password: string; email: string; displayName: string }]
  switchMode: []
}>()

const username = ref('')
const displayName = ref('')
const email = ref('')
const password = ref('')
const isPasswordVisible = ref(false)
const passwordStrength = computed(() => {
  if (!password.value) {
    return { label: t('auth.passwordNotEntered'), level: 'empty', value: 0 }
  }

  const characterTypes = [/[a-z]/.test(password.value), /[A-Z]/.test(password.value), /\d/.test(password.value), /[^a-zA-Z0-9]/.test(password.value)].filter(Boolean).length
  const score = Number(password.value.length >= 8) + Number(password.value.length >= 12) + Number(password.value.length >= 16) + Number(characterTypes >= 2) + Number(characterTypes >= 3) + Number(characterTypes >= 4)

  if (score <= 2) {
    return { label: t('auth.passwordWeak'), level: 'weak', value: 1 }
  }

  if (score === 3) {
    return { label: t('auth.passwordFair'), level: 'fair', value: 2 }
  }

  if (score === 4) {
    return { label: t('auth.passwordGood'), level: 'good', value: 3 }
  }

  return { label: t('auth.passwordStrong'), level: 'strong', value: 4 }
})

function handleSubmit() {
  emit('submit', {
    username: username.value,
    password: password.value,
    email: email.value,
    displayName: displayName.value,
  })
}
</script>

<template>
  <div class="w-full">
    <span class="text-[9px] font-bold tracking-[0.2em] text-flixer-accent">{{ t('auth.joinCommunity') }}</span>
    <h1 id="registration-title" class="mt-3 text-3xl font-semibold tracking-tight text-flixer-text sm:text-4xl">
      {{ t('auth.createYourAccountTitle') }}
      <span class="text-flixer-accent">.</span>
    </h1>
    <p class="mt-2 text-sm text-flixer-muted">{{ t('auth.registrationDescription') }}</p>

    <form class="mt-7 flex flex-col" @submit.prevent="handleSubmit">
      <AuthField id="registration-display-name" :label="t('auth.displayName')">
        <template #icon>
          <path d="M4 6h16M4 12h10M4 18h6" />
        </template>
        <input id="registration-display-name" v-model.trim="displayName" type="text" name="displayName" :placeholder="t('auth.displayNamePlaceholder')" autocomplete="nickname" maxlength="64" :disabled="registrationEnabled !== true" class="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-flixer-text outline-none placeholder:text-flixer-muted/70 disabled:cursor-not-allowed" />
      </AuthField>

      <AuthField id="registration-username" class="mt-4" :label="t('auth.username')">
        <template #icon>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
        </template>
        <input id="registration-username" v-model.trim="username" type="text" name="username" :placeholder="t('auth.usernamePlaceholder')" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" minlength="3" maxlength="64" pattern="[a-zA-Z0-9_.\-]+" :disabled="registrationEnabled !== true" class="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-flixer-text outline-none placeholder:text-flixer-muted/70 disabled:cursor-not-allowed" required />
      </AuthField>
      <AuthField id="registration-email" class="mt-4" :label="t('auth.email')">
        <template #icon>
          <rect x="3.5" y="5" width="17" height="14" rx="2" />
          <path d="m4.5 7 7.5 6 7.5-6" />
        </template>
        <input id="registration-email" v-model.trim="email" type="email" name="email" :placeholder="t('auth.emailPlaceholder')" autocomplete="email" autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="254" :disabled="registrationEnabled !== true" class="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-flixer-text outline-none placeholder:text-flixer-muted/70 disabled:cursor-not-allowed" required />
      </AuthField>

      <AuthField id="registration-password" class="mt-4" :label="t('auth.password')">
        <template #icon>
          <rect x="4.5" y="10" width="15" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2" />
        </template>
        <input id="registration-password" v-model="password" :type="isPasswordVisible ? 'text' : 'password'" name="password" :placeholder="t('auth.passwordMinimumPlaceholder')" autocomplete="new-password" minlength="8" maxlength="128" :disabled="registrationEnabled !== true" class="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-flixer-text outline-none placeholder:text-flixer-muted/70 disabled:cursor-not-allowed" required />
        <template #trailing>
          <button class="grid size-11 shrink-0 place-items-center rounded-r-lg text-flixer-muted transition hover:text-flixer-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-not-allowed" type="button" :disabled="registrationEnabled !== true" :aria-label="isPasswordVisible ? t('auth.hidePassword') : t('auth.showPassword')" @click="isPasswordVisible = !isPasswordVisible">
            <svg v-if="isPasswordVisible" class="size-[18px] fill-none stroke-current" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
              <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5.2 0 8.5 5 9 7-.2.8-1 2-2.3 3.2M6.2 6.2C3.8 7.7 2.4 10.4 2 12c.5 1.6 3.8 7 10 7 1.1 0 2.1-.2 3-.5" />
            </svg>
            <svg v-else class="size-[18px] fill-none stroke-current" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </template>
      </AuthField>
      <div class="mt-2.5">
        <div class="flex justify-between text-[10px] text-flixer-muted">
          <span>{{ t('auth.passwordStrength') }}</span>
          <span class="font-semibold text-flixer-text/70">{{ passwordStrength.label }}</span>
        </div>
        <div class="mt-2 grid grid-cols-4 gap-1.5" role="meter" :aria-label="t('auth.passwordStrength')" aria-valuemin="0" aria-valuemax="4" :aria-valuenow="passwordStrength.value" :aria-valuetext="t('auth.passwordStrengthValue', { strength: passwordStrength.label })">
          <span
            v-for="segment in 4"
            :key="segment"
            class="h-1 rounded bg-flixer-border transition-colors"
            :class="
              segment <= passwordStrength.value
                ? {
                    weak: 'bg-rose-400',
                    fair: 'bg-amber-400',
                    good: 'bg-emerald-400',
                    strong: 'bg-teal-300',
                  }[passwordStrength.level]
                : ''
            "
          ></span>
        </div>
        <p class="mt-1.5 text-[10px] leading-4 text-flixer-muted">{{ t('auth.passwordGuidance') }}</p>
      </div>

      <p v-if="registrationStatusError" class="mt-3 text-xs leading-5 text-flixer-muted" role="status">
        {{ registrationStatusError }}
      </p>
      <p v-else-if="registrationEnabled === false" class="mt-3 text-xs leading-5 text-flixer-muted" role="status">{{ t('auth.registrationDisabled') }}</p>
      <p v-else-if="registrationEnabled === null" class="mt-3 text-xs leading-5 text-flixer-muted" role="status">{{ t('auth.checkingRegistration') }}</p>

      <button class="mt-5 flex h-12 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-flixer-primary to-flixer-secondary text-sm font-semibold text-white shadow-lg shadow-flixer-primary/20 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-wait disabled:opacity-60" type="submit" :disabled="isSubmitting || registrationEnabled !== true" :aria-busy="isSubmitting">
        <span>{{ isSubmitting ? t('auth.creatingAccount') : t('auth.createAccount') }}</span>
        <svg v-if="!isSubmitting" class="size-[17px] fill-none stroke-current" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M4 10h11M10 5l5 5-5 5" />
        </svg>
        <span v-else class="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true"></span>
      </button>
    </form>

    <div class="my-6 flex items-center gap-3 text-[9px] font-semibold tracking-[0.16em] text-flixer-muted/70">
      <span class="h-px flex-1 bg-flixer-border"></span>
      <span>{{ t('auth.aBetterWayToWatch') }}</span>
      <span class="h-px flex-1 bg-flixer-border"></span>
    </div>

    <button class="flex w-full items-center gap-3 rounded-xl border border-flixer-border bg-flixer-surface/50 p-3 text-left transition hover:-translate-y-px hover:border-flixer-accent/40 hover:bg-flixer-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" type="button" @click="emit('switchMode')">
      <span class="grid size-[34px] shrink-0 place-items-center rounded-lg border border-flixer-accent/20 bg-flixer-primary/10 text-flixer-accent" aria-hidden="true">
        <svg class="size-[17px] fill-none stroke-current" viewBox="0 0 24 24">
          <path d="M20 11a8 8 0 0 0-14.9-3M4 4v4h4M4 13a8 8 0 0 0 14.9 3M20 20v-4h-4" />
        </svg>
      </span>
      <span class="flex min-w-0 flex-1 flex-col gap-0.5">
        <strong class="text-xs font-semibold text-flixer-text/90">{{ t('auth.alreadyHaveAccount') }}</strong>
        <span class="text-[11px] leading-5 text-flixer-muted">{{ t('auth.signInInstead') }}</span>
      </span>
      <svg class="size-[17px] shrink-0 fill-none stroke-flixer-accent" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M4 10h11M10 5l5 5-5 5" />
      </svg>
    </button>
  </div>
</template>
