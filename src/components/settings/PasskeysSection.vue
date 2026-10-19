<script setup lang="ts">
import { browserSupportsWebAuthn, type PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/browser'
import { openModal } from '@kolirt/vue-modal'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { listPasskeys, registerPasskey, setPasskeyRequired, type Passkey, type UserProfile } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError, useProfile } from '../../composables/useProfile'
import AddPasskeyForm from './AddPasskeyForm.vue'
import AddPasskeyModal from './AddPasskeyModal.vue'
import DisablePasskeyRequiredModal from './DisablePasskeyRequiredModal.vue'
import PasskeyList from './PasskeyList.vue'
import RemovePasskeyModal from './RemovePasskeyModal.vue'

const { profile, load: loadProfile, setProfile } = useProfile()
const { t } = useI18n()
const isTogglingRequired = ref(false)
const passkeyRequired = computed(() => profile.value?.passkeyRequired === true)

async function handleToggleRequired() {
  if (passkeyRequired.value) {
    const updated = await openModal<UserProfile>(DisablePasskeyRequiredModal).catch(() => null)
    if (updated) {
      setProfile(updated)
      notify.success(t('settings.passkeys.noLongerRequired'))
    }
    return
  }

  isTogglingRequired.value = true
  try {
    setProfile(await setPasskeyRequired(true))
    notify.success(t('settings.passkeys.nowRequired'))
  } catch (error: unknown) {
    notify.error(describeError(error))
  } finally {
    isTogglingRequired.value = false
  }
}

const supported = browserSupportsWebAuthn()
const passkeys = ref<Passkey[]>([])
const isLoading = ref(true)
const isRegistering = ref(false)
const deletingId = ref<string | null>(null)

function describeError(error: unknown): string {
  console.error('[settings] passkey error', error)
  if (error instanceof Error && error.name === 'NotAllowedError') {
    return t('settings.passkeys.errors.requestCancelled', { message: error.message })
  }
  if (error instanceof Error && error.name === 'InvalidStateError') {
    return t('settings.passkeys.errors.alreadyRegistered')
  }
  return describeRequestError(error, t('settings.passkeys.errors.requestFailed'))
}

async function load() {
  try {
    passkeys.value = await listPasskeys()
  } catch (error: unknown) {
    notify.error(describeError(error))
  } finally {
    isLoading.value = false
  }
}

async function handleAdd(name: string) {
  const options = await openModal<PublicKeyCredentialCreationOptionsJSON>(AddPasskeyModal).catch(() => null)
  if (!options) {
    return
  }

  isRegistering.value = true
  try {
    const passkey = await registerPasskey(options, name)
    passkeys.value = [passkey, ...passkeys.value]
    notify.success(t('settings.passkeys.added', { name: passkey.name }))
  } catch (error: unknown) {
    notify.error(describeError(error))
  } finally {
    isRegistering.value = false
  }
}

async function handleRemove(passkey: Passkey) {
  const removed = await openModal<boolean>(RemovePasskeyModal, { props: { passkeyId: passkey.id, passkeyName: passkey.name } }).catch(() => false)
  if (!removed) {
    return
  }

  passkeys.value = passkeys.value.filter((item) => item.id !== passkey.id)
  notify.success(t('settings.passkeys.removed'))
  if (passkeys.value.length === 0) {
    void loadProfile(true)
  }
}

onMounted(() => {
  void loadProfile(true)
  void load()
})
</script>

<template>
  <section aria-labelledby="passkeys-heading">
    <h2 id="passkeys-heading" class="text-lg font-semibold">{{ t('settings.tabs.passkeys') }}</h2>
    <p class="mt-1 text-sm text-flixer-muted">{{ t('settings.passkeys.description') }}</p>

    <div class="mt-6 flex flex-col gap-8">
      <div class="flex items-center justify-between gap-4 rounded-lg border border-flixer-border bg-flixer-surface/60 p-4">
        <div>
          <h3 id="passkey-required-label" class="text-sm font-semibold">{{ t('settings.passkeys.requiredTitle') }}</h3>
          <p class="mt-1 text-sm text-flixer-muted">{{ t('settings.passkeys.requiredDescription') }}</p>
          <p v-if="!isLoading && passkeys.length === 0 && !passkeyRequired" class="mt-1 text-xs text-flixer-muted">{{ t('settings.passkeys.addBeforeRequired') }}</p>
        </div>
        <button class="relative block shrink-0 cursor-pointer rounded-full border transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-not-allowed disabled:opacity-50" :class="passkeyRequired ? 'border-flixer-primary bg-flixer-primary' : 'border-flixer-muted/50 bg-flixer-border'" style="width: 2.75rem; height: 1.5rem" type="button" role="switch" aria-labelledby="passkey-required-label" :aria-checked="passkeyRequired" :disabled="isTogglingRequired || !profile || (!passkeyRequired && passkeys.length === 0)" @click="handleToggleRequired">
          <span class="absolute rounded-full bg-white shadow transition-all" :style="{ top: '0.1875rem', width: '1rem', height: '1rem', left: passkeyRequired ? '1.5rem' : '0.1875rem' }"></span>
        </button>
      </div>
      <div>
        <p v-if="!supported" class="rounded-lg border border-rose-300/30 bg-rose-300/10 p-3 text-sm text-rose-200" role="alert">{{ t('settings.passkeys.unsupported') }}</p>
        <AddPasskeyForm v-else :is-registering="isRegistering" @add="handleAdd" />
      </div>

      <div>
        <p v-if="isLoading" class="text-sm text-flixer-muted">{{ t('settings.passkeys.loading') }}</p>
        <PasskeyList v-else :passkeys="passkeys" :deleting-id="deletingId" @remove="handleRemove" />
      </div>
    </div>
  </section>
</template>
