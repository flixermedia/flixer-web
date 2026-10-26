<script setup lang="ts">
import { openModal } from '@kolirt/vue-modal'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import ListSkeleton from '../ui/ListSkeleton.vue'
import { useRouter } from 'vue-router'
import { clearAccessToken, updateProfile } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError, useProfile } from '../../composables/useProfile'
import TextInput from '../ui/TextInput.vue'
import AvatarUploader from './AvatarUploader.vue'
import DeleteAccountModal from './DeleteAccountModal.vue'
import PasswordSection from './PasswordSection.vue'
import PrivacySection from './PrivacySection.vue'

const router = useRouter()
const { t } = useI18n()
const { profile, load, setProfile, clear } = useProfile()

async function confirmDeleteAccount() {
  const deleted = await openModal<boolean>(DeleteAccountModal).catch(() => false)
  if (deleted) {
    clearAccessToken()
    clear()
    notify.success(t('settings.profile.accountDeleted'))
    await router.replace({ name: 'login' })
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
    const updated = await updateProfile(changes)
    setProfile(updated)
    email.value = updated.email ?? ''
    notify.success(emailChanged && updated.pendingEmail ? t('settings.profile.emailVerificationSent', { email: updated.pendingEmail }) : t('settings.profile.updated'))
  } catch (error: unknown) {
    console.error('[settings] profile update failed', error)
    notify.error(describeRequestError(error, t('settings.profile.updateFailed')))
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
        <TextInput v-model="displayName" :label="t('settings.profile.displayName')" type="text" maxlength="64" required autocomplete="nickname" />
        <TextInput :model-value="profile?.username ?? ''" :label="t('settings.profile.username')" type="text" disabled />
        <TextInput v-model.trim="email" :label="t('settings.profile.email')" type="email" maxlength="254" autocomplete="email" autocapitalize="none" :hint="profile?.pendingEmail ? t('settings.profile.pendingEmailHint', { email: profile.pendingEmail }) : undefined" />

        <button type="submit" class="flex h-12 w-fit items-center justify-center rounded-lg bg-gradient-to-r from-flixer-primary to-flixer-secondary px-8 text-sm font-semibold text-white shadow-lg shadow-flixer-primary/20 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-wait disabled:opacity-60" :disabled="isSaving">
          {{ isSaving ? t('settings.profile.saving') : t('common.save') }}
        </button>
      </form>
    </section>

    <PasswordSection />

    <PrivacySection />

    <section class="rounded-lg border border-rose-400/20 bg-rose-400/5 p-5 lg:col-span-2" aria-labelledby="danger-heading">
      <h2 id="danger-heading" class="text-lg font-semibold text-rose-200">{{ t('settings.profile.deleteAccountTitle') }}</h2>
      <p class="mt-1 text-sm text-flixer-muted">{{ t('settings.profile.deleteAccountDescription') }}</p>
      <button type="button" class="mt-4 flex h-11 items-center justify-center rounded-lg border border-rose-400/40 px-6 text-sm font-semibold text-rose-200 transition hover:bg-rose-400/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300" @click="confirmDeleteAccount">{{ t('settings.profile.deleteAccountButton') }}</button>
    </section>
  </div>
</template>
