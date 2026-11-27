<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import ListSkeleton from '../ui/ListSkeleton.vue'
import { useRouter } from 'vue-router'
import { clearAccessToken, deleteAccount, getRegistrationFields, listMyLinkedAccounts, updateProfile, type PublicLinkedAccount, type RegistrationFieldValue } from '../../api'
import { notify } from '../../composables/notify'
import { requestPassword } from '../../composables/requestPassword'
import { describeRequestError, useProfile } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import TextInput from '../ui/TextInput.vue'
import AvatarUploader from './AvatarUploader.vue'
import PasswordSection from './PasswordSection.vue'
import PrivacySection from './PrivacySection.vue'
import ExternalProvidersSection from './ExternalProvidersSection.vue'

const router = useRouter()
const { t } = useI18n()
const { profile, load, setProfile, clear } = useProfile()
const isDeletingAccount = ref(false)
const registrationFields = ref<RegistrationFieldValue[]>([])
const linkedAccounts = ref<PublicLinkedAccount[]>([])
void getRegistrationFields().then((fields) => { registrationFields.value = fields }).catch(() => undefined)
void listMyLinkedAccounts().then((accounts) => { linkedAccounts.value = accounts }).catch(() => undefined)

async function confirmDeleteAccount() {
  if (isDeletingAccount.value) return
  const [passwordError, password] = await catchError(
    requestPassword({
      title: t('settings.profile.deleteConfirmTitle'),
      description: t('settings.profile.deleteConfirmDescription'),
      passwordLabel: t('settings.profile.passwordLabel'),
      submitLabel: t('settings.profile.deleteAccountButton'),
      danger: true,
    }),
  )
  if (passwordError) {
    console.error('[settings] could not request password for account deletion', passwordError)
    notify.error(describeRequestError(passwordError, t('settings.profile.deleteFailed')))
    return
  }
  if (!password) return

  isDeletingAccount.value = true
  try {
    const [error] = await catchError(deleteAccount(password))
    if (error) {
      console.error('[settings] account deletion failed', error)
      notify.error(describeRequestError(error, t('settings.profile.deleteFailed')))
      return
    }
    clearAccessToken()
    clear()
    notify.success(t('settings.profile.accountDeleted'))
    await router.replace({ name: 'login' })
  } finally {
    isDeletingAccount.value = false
  }
}

const displayName = ref('')
const email = ref('')
const isLoading = ref(true)
const isSaving = ref(false)

watch(
  profile,
  (value) => {
    if (value) {
      displayName.value = value.displayName
      email.value = value.email ?? ''
    }
  },
  { immediate: true },
)

void load(true).finally(() => {
  isLoading.value = false
})

async function save() {
  isSaving.value = true
  try {
    const changes: { displayName: string; email?: string } = { displayName: displayName.value }
    if (email.value && email.value !== profile.value?.email) {
      changes.email = email.value
    }
    const emailChanged = Boolean(changes.email)
    const [error, updated] = await catchError(updateProfile(changes))
    if (error) {
      console.error('[settings] profile update failed', error)
      notify.error(describeRequestError(error, t('settings.profile.updateFailed')))
    } else {
      setProfile(updated)
      email.value = updated.email ?? ''
      notify.success(emailChanged && updated.pendingEmail ? t('settings.profile.emailVerificationSent', { email: updated.pendingEmail }) : t('settings.profile.updated'))
    }
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="grid grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-12">
    <section aria-labelledby="profile-heading">
      <h2 id="profile-heading" class="text-lg font-semibold">{{ t('settings.profile.title') }}</h2>
      <p class="mt-1 text-sm text-flixer-muted">{{ t('settings.profile.description') }}</p>

      <ListSkeleton v-if="isLoading && !profile" class="mt-6" />
      <form v-else class="mt-6 flex flex-col gap-5" @submit.prevent="save">
        <AvatarUploader />
        <TextInput v-model="displayName" :label="t('settings.profile.displayName')" type="text" maxlength="64" required
          autocomplete="nickname" />
        <TextInput :model-value="profile?.username ?? ''" :label="t('settings.profile.username')" type="text"
          disabled />
        <TextInput v-model.trim="email" :label="t('settings.profile.email')" type="email" maxlength="254"
          autocomplete="email" autocapitalize="none"
          :hint="profile?.pendingEmail ? t('settings.profile.pendingEmailHint', { email: profile.pendingEmail }) : undefined" />

        <button type="submit"
          class="flex h-12 w-fit items-center justify-center rounded bg-gradient-to-r from-flixer-primary to-flixer-secondary px-8 text-sm font-semibold text-white shadow-lg shadow-flixer-primary/20 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-wait disabled:opacity-60"
          :disabled="isSaving">
          {{ isSaving ? t('settings.profile.saving') : t('common.save') }}
        </button>
      </form>
    </section>

    <PasswordSection />

    <section v-if="registrationFields.length" aria-labelledby="registration-fields-heading">
      <h2 id="registration-fields-heading" class="text-lg font-semibold">{{ t('pageBuilder.registrationDetails') }}</h2>
      <dl class="mt-4 grid gap-3">
        <div v-for="entry in registrationFields" :key="entry.id">
          <dt class="text-xs text-flixer-muted">{{ entry.label }}</dt>
          <dd class="break-words text-sm">{{ entry.value }}</dd>
        </div>
      </dl>
    </section>

    <PrivacySection />

    <ExternalProvidersSection />

    <section v-if="linkedAccounts.length" class="lg:col-span-2" aria-labelledby="linked-accounts-heading">
      <h2 id="linked-accounts-heading" class="text-lg font-semibold">Linked Accounts</h2>
      <p class="mt-1 text-sm text-flixer-muted">Media server accounts linked to your Flixer account.</p>
      <ul class="mt-4 grid gap-3 sm:grid-cols-2">
        <li v-for="acct in linkedAccounts" :key="acct.id" class="flex items-center justify-between gap-3 rounded border border-flixer-border bg-flixer-surface/50 px-4 py-3">
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold text-flixer-text">{{ acct.serverName }} <span class="text-xs font-normal text-flixer-muted">({{ t(`admin.invites.types.${acct.serverType}`) }})</span></p>
            <p class="mt-0.5 truncate text-xs text-flixer-muted">
              <span v-if="acct.externalUsername">{{ acct.externalUsername }}</span>
              <span v-else-if="acct.externalEmail">{{ acct.externalEmail }}</span>
              · <span :class="acct.status === 'failed' ? 'text-rose-400' : acct.status === 'completed' ? 'text-emerald-400' : 'text-amber-400'">{{ acct.status }}</span>
            </p>
            <p v-if="acct.error" class="mt-1 text-xs text-rose-400">{{ acct.error }}</p>
          </div>
          <a v-if="acct.serverUrl && acct.status === 'completed'" :href="acct.serverUrl" target="_blank" rel="noopener noreferrer" class="shrink-0 rounded border border-flixer-border px-3 py-1.5 text-xs font-semibold text-flixer-text hover:bg-flixer-border/40">Open</a>
        </li>
      </ul>
    </section>

    <section class="rounded border border-rose-400/20 bg-rose-400/5 p-5 lg:col-span-2" aria-labelledby="danger-heading">
      <h2 id="danger-heading" class="text-lg font-semibold text-rose-200">{{ t('settings.profile.deleteAccountTitle') }}
      </h2>
      <p class="mt-1 text-sm text-flixer-muted">{{ t('settings.profile.deleteAccountDescription') }}</p>
      <button type="button"
        class="mt-4 flex h-11 items-center justify-center rounded border border-rose-400/40 px-6 text-sm font-semibold text-rose-200 transition hover:bg-rose-400/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300 disabled:cursor-wait disabled:opacity-60"
        :disabled="isDeletingAccount" @click="confirmDeleteAccount">{{ t('settings.profile.deleteAccountButton')
        }}</button>
    </section>
  </div>
</template>
