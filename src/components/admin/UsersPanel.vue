<script setup lang="ts">
import { openModal } from '@kolirt/vue-modal'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminSkeleton from './AdminSkeleton.vue'
import { listAdminUsers, listSettings, updateSetting, type AdminUser } from '../../api'
import { getMailStatus } from '../../api/mail'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import UserAvatar from '../ui/UserAvatar.vue'
import AdminSection from './AdminSection.vue'
import AdminToggle from './AdminToggle.vue'
import CreateUserModal from './CreateUserModal.vue'
import AccessControlsModal from './AccessControlsModal.vue'
import EditUserModal from './EditUserModal.vue'
import StatusPill from './StatusPill.vue'
import UserPaymentsModal from './UserPaymentsModal.vue'
import { usePayments } from '../../composables/usePayments'

const { t, locale } = useI18n()
const payments = usePayments()

const users = ref<AdminUser[]>([])
const isLoading = ref(true)
const loadError = ref('')
const query = ref('')
const registrationEnabled = ref(true)
const smtpConfigured = ref(false)
const verificationEnabled = ref(true)

const primaryButton = 'rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-60'
const secondaryButton = 'rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15 disabled:opacity-60'

const filtered = computed(() => {
  const needle = query.value.trim().toLowerCase()
  return users.value.filter((user) => `${user.displayName} ${user.username} ${user.email ?? ''}`.toLowerCase().includes(needle))
})

type Status = 'active' | 'unverified' | 'disabled'
const statusTone = { active: 'good', unverified: 'warn', disabled: 'bad' } as const
const statusOf = (user: AdminUser): Status => (user.disabled ? 'disabled' : !user.emailVerified ? 'unverified' : 'active')

const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
]

function relativeTime(iso: string | null) {
  if (!iso) return t('admin.users.never')
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000
  if (Math.abs(seconds) < 60) return t('admin.users.justNow')
  const [unit, size] = UNITS.find(([, s]) => Math.abs(seconds) >= s) ?? UNITS[2]
  return new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto' }).format(Math.round(seconds / size), unit)
}

async function load() {
  try {
    const [error, result] = await catchError(Promise.all([listAdminUsers(), listSettings(), getMailStatus().catch(() => null)]))
    if (error) {
      console.error('[users] failed to load', error)
      loadError.value = describeRequestError(error, t('admin.users.loadError'))
    } else {
      const [list, settings, mail] = result
      users.value = list
      registrationEnabled.value = settings.find((setting) => setting.key === 'registration_enabled')?.value !== false
      const host = settings.find((setting) => setting.key === 'smtp_host')?.value
      smtpConfigured.value = Boolean(mail?.outboundReady) || (typeof host === 'string' && host.trim() !== '')
      const policy = settings.find((setting) => setting.key === 'original_quality_access')?.value
      originalAccess.value = policy === 'everyone' || policy === 'nobody' ? policy : 'admins'
      restrictedDisplay.value = settings.find((setting) => setting.key === 'restricted_media_display')?.value === 'locked' ? 'locked' : 'hidden'
      verificationEnabled.value = settings.find((setting) => setting.key === 'email_verification_required')?.value !== false
      loadError.value = ''
    }
  } finally {
    isLoading.value = false
  }
}

async function openEdit(user: AdminUser) {
  const refresh = await openModal<boolean>(EditUserModal, { props: { user } }).catch(() => false)
  if (refresh) await load()
}

async function openPayments(user: AdminUser) {
  await openModal<boolean>(UserPaymentsModal, { props: { user } }).catch(() => false)
}

async function openAccess(user: AdminUser) {
  await openModal<boolean>(AccessControlsModal, { props: { user } }).catch(() => false)
}

async function setRestrictedDisplay(value: 'hidden' | 'locked') {
  const previous = restrictedDisplay.value
  restrictedDisplay.value = value
  const [error] = await catchError(updateSetting('restricted_media_display', value))
  if (error) {
    restrictedDisplay.value = previous
    notify.error(describeRequestError(error, t('admin.access.displayError')))
  }
}

async function openCreate() {
  const refresh = await openModal<boolean>(CreateUserModal).catch(() => false)
  if (refresh) await load()
}
async function setRegistration(enabled: boolean) {
  const previous = registrationEnabled.value
  registrationEnabled.value = enabled
  const [error] = await catchError(updateSetting('registration_enabled', enabled))
  if (error) {
    registrationEnabled.value = previous
    notify.error(describeRequestError(error, t('admin.users.registrationError')))
  }
}

async function setOriginalAccess(value: string) {
  const previous = originalAccess.value
  originalAccess.value = value
  const [error] = await catchError(updateSetting('original_quality_access', value))
  if (error) {
    originalAccess.value = previous
    notify.error(describeRequestError(error, t('admin.users.originalAccessError')))
  }
}

async function setVerification(enabled: boolean) {
  const previous = verificationEnabled.value
  verificationEnabled.value = enabled
  const [error] = await catchError(updateSetting('email_verification_required', enabled))
  if (error) {
    verificationEnabled.value = previous
    notify.error(describeRequestError(error, t('admin.users.verificationError')))
  }
}

const originalAccess = ref('admins')
const restrictedDisplay = ref<'hidden' | 'locked'>('hidden')

onMounted(() => {
  void payments.load()
  void load()
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <AdminSection :title="t('admin.users.title')" :description="t('admin.users.description')">
      <template #actions>
        <input v-model="query" type="search" :placeholder="t('admin.users.searchPlaceholder')" class="rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm" />
        <button type="button" :class="primaryButton" @click="openCreate">{{ t('admin.users.addUser') }}</button>
      </template>

      <p v-if="loadError" role="alert" class="mb-3 text-sm text-red-300">{{ loadError }}</p>
      <AdminSkeleton v-if="isLoading" variant="table" :rows="3" />
      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-160 text-left text-sm">
          <thead class="text-xs text-flixer-muted">
            <tr>
              <th class="pb-2 font-medium">{{ t('admin.users.user') }}</th>
              <th class="pb-2 font-medium">{{ t('admin.users.role') }}</th>
              <th class="pb-2 font-medium">{{ t('admin.users.status') }}</th>
              <th class="pb-2 font-medium">{{ t('admin.users.passkeys') }}</th>
              <th class="pb-2 font-medium">{{ t('admin.users.lastActive') }}</th>
              <th class="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filtered" :key="user.id" class="border-t border-flixer-border">
              <td class="py-3">
                <div class="flex items-center gap-3">
                  <div class="size-8 shrink-0 overflow-hidden rounded text-xs"><UserAvatar :avatar-url="user.avatarUrl" :name="user.displayName" /></div>
                  <div>
                    <p class="font-medium">
                      {{ user.displayName }} <span v-if="user.current" class="ml-1 text-xs font-normal text-flixer-muted">({{ t('admin.users.you') }})</span>
                    </p>
                    <p class="text-xs text-flixer-muted">
                      {{ user.username }}<template v-if="user.email"> · {{ user.email }}</template>
                    </p>
                  </div>
                </div>
              </td>
              <td>
                <StatusPill :tone="user.role === 'admin' ? 'accent' : 'neutral'">{{ user.role === 'admin' ? t('admin.users.administrator') : t('admin.users.user') }}</StatusPill>
              </td>
              <td>
                <StatusPill :tone="statusTone[statusOf(user)]">{{ t(`admin.users.statuses.${statusOf(user)}`) }}</StatusPill>
              </td>
              <td class="text-flixer-muted">{{ user.passkeys }}</td>
              <td class="text-flixer-muted">{{ relativeTime(user.lastActiveAt) }}</td>
              <td class="text-right">
                <div class="flex justify-end gap-2">
                  <button type="button" :class="secondaryButton" class="inline-flex items-center gap-1.5" :aria-label="t('admin.access.manage', { name: user.displayName })" @click="openAccess(user)"><Icon icon="lucide:shield-check" class="size-3.5" aria-hidden="true" />{{ t('admin.access.manageShort') }}</button>
                  <button v-if="payments.active.value" type="button" :class="secondaryButton" class="inline-flex items-center gap-1.5" :aria-label="t('payments.admin.userPayments.manage', { name: user.displayName || user.username })" @click="openPayments(user)"><Icon icon="lucide:credit-card" class="size-3.5" aria-hidden="true" />{{ t('payments.admin.userPayments.button') }}</button>
                  <button type="button" :class="secondaryButton" @click="openEdit(user)">{{ t('admin.users.edit') }}</button>
                </div>
              </td>
            </tr>
            <tr v-if="filtered.length === 0">
              <td colspan="6" class="py-6 text-center text-flixer-muted">{{ users.length === 0 ? t('admin.users.noUsers') : t('admin.users.noSearchMatches') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </AdminSection>

    <AdminSection :title="t('admin.users.signUpPolicy')" :description="t('admin.users.signUpPolicyDescription')">
      <AdminToggle :model-value="registrationEnabled" :label="t('admin.users.allowPublicRegistration')" :description="t('admin.users.publicRegistrationDescription')" @update:model-value="setRegistration" />
      <div :class="{ 'pointer-events-none opacity-60': !smtpConfigured }">
        <AdminToggle :model-value="verificationEnabled" :label="t('admin.users.requireEmailVerification')" :description="smtpConfigured ? t('admin.users.requireEmailVerificationDescription') : t('admin.users.emailVerificationOff')" @update:model-value="setVerification" />
      </div>
    </AdminSection>

    <AdminSection :title="t('admin.access.displayTitle')" :description="t('admin.access.displayDescription')">
      <div class="grid gap-2 sm:grid-cols-2">
        <button v-for="mode in ['hidden', 'locked'] as const" :key="mode" type="button" class="flex items-start gap-3 rounded border p-3 text-left transition focus-visible:outline-2 focus-visible:outline-flixer-accent" :class="restrictedDisplay === mode ? 'border-flixer-primary bg-flixer-primary/10' : 'border-flixer-border hover:bg-white/5'" :aria-pressed="restrictedDisplay === mode" @click="setRestrictedDisplay(mode)">
          <Icon :icon="mode === 'hidden' ? 'lucide:eye-off' : 'lucide:lock'" class="mt-0.5 size-5 shrink-0" :class="restrictedDisplay === mode ? 'text-flixer-accent' : 'text-flixer-muted'" aria-hidden="true" />
          <span><span class="block text-sm font-semibold">{{ t(`admin.access.display.${mode}`) }}</span><span class="mt-0.5 block text-xs text-flixer-muted">{{ t(`admin.access.display.${mode}Description`) }}</span></span>
        </button>
      </div>
    </AdminSection>

    <AdminSection :title="t('admin.users.originalAccess')" :description="t('admin.users.originalAccessDescription')">
      <select :value="originalAccess" class="w-full max-w-xs rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm" @change="setOriginalAccess(($event.target as HTMLSelectElement).value)">
        <option value="admins">{{ t('admin.users.originalAccessAdmins') }}</option>
        <option value="everyone">{{ t('admin.users.originalAccessEveryone') }}</option>
        <option value="nobody">{{ t('admin.users.originalAccessNobody') }}</option>
      </select>
    </AdminSection>
  </div>
</template>
