<script setup lang="ts">
import { openModal } from '@kolirt/vue-modal'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminSkeleton from './AdminSkeleton.vue'
import { deleteAdminUser, listAdminUsers, listSettings, revokeAdminUserSessions, updateAdminUser, updateSetting, type AdminUser, type AdminUserChanges, type ServerSetting } from '../../api'
import { getMailStatus } from '../../api/mail'
import { confirmAction } from '../../composables/confirm'
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
import LoginSecuritySection from './LoginSecuritySection.vue'
import { usePayments } from '../../composables/usePayments'
import { runUserBatch } from './userBatch'

const props = withDefaults(defineProps<{ standalone?: boolean }>(), { standalone: false })

const { t, locale } = useI18n()
const payments = usePayments()

const users = ref<AdminUser[]>([])
const settingsValues = ref<ServerSetting[]>([])
const isLoading = ref(true)
const loadError = ref('')
const query = ref('')
const selectedIds = ref<string[]>([])
let selectionAnchor: string | null = null
const bulkAction = ref('')
const bulkBusy = ref(false)
const bulkErrors = ref<Array<{ name: string; message: string }>>([])
const registrationEnabled = ref(true)
const smtpConfigured = ref(false)
const verificationEnabled = ref(true)
const quickConnectEnabled = ref(false)
const isSavingQuickConnect = ref(false)

const primaryButton = 'rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-60'
const secondaryButton = 'rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15 disabled:opacity-60'

const filtered = computed(() => {
  const needle = query.value.trim().toLowerCase()
  return users.value.filter((user) => {
    const origin = user.invited ? `invited ${user.invite?.serverType ?? ''} ${user.invite?.serverName ?? ''} ${user.invite?.code ?? ''}` : 'flixer'
    return `${user.displayName} ${user.username} ${user.email ?? ''} ${origin}`.toLowerCase().includes(needle)
  })
})

function accountServerLabel(user: AdminUser): string {
  const invite = user.invite
  if (!invite || invite.serverType === 'flixer') return t('admin.invites.types.flixer')
  const typeLabel = t(`admin.invites.types.${invite.serverType}`)
  if (!invite.serverName || invite.serverName.trim().toLowerCase() === typeLabel.toLowerCase()) return typeLabel
  return `${typeLabel} · ${invite.serverName}`
}
const selectableVisible = computed(() => filtered.value.filter((user) => !user.current))
const selectedUsers = computed(() => users.value.filter((user) => !user.current && selectedIds.value.includes(user.id)))
const allVisibleSelected = computed(() => selectableVisible.value.length > 0 && selectableVisible.value.every((user) => selectedIds.value.includes(user.id)))
const someVisibleSelected = computed(() => selectableVisible.value.some((user) => selectedIds.value.includes(user.id)))

const bulkChanges = computed<Record<string, AdminUserChanges>>(() => ({
  makeAdmin: { role: 'admin' },
  makeUser: { role: 'user' },
  enable: { disabled: false },
  disable: { disabled: true },
  ...(props.standalone ? {} : {
    originalInherit: { originalAccess: 'inherit' },
    originalAllow: { originalAccess: 'allow' },
    originalDeny: { originalAccess: 'deny' },
  }),
}))
const bulkActions = computed(() => [...Object.keys(bulkChanges.value), 'revokeSessions', 'delete'])

function selectVisible(event: Event) {
  selectionAnchor = null
  const checked = (event.target as HTMLInputElement).checked
  const visible = new Set(selectableVisible.value.map((user) => user.id))
  selectedIds.value = checked
    ? [...new Set([...selectedIds.value, ...visible])]
    : selectedIds.value.filter((id) => !visible.has(id))
}

function selectUser(user: AdminUser, event: MouseEvent) {
  const checked = (event.currentTarget as HTMLInputElement).checked
  const visible = selectableVisible.value
  const currentIndex = visible.findIndex((item) => item.id === user.id)
  const anchorIndex = visible.findIndex((item) => item.id === selectionAnchor)
  const range = event.shiftKey && anchorIndex !== -1 && currentIndex !== -1
    ? visible.slice(Math.min(anchorIndex, currentIndex), Math.max(anchorIndex, currentIndex) + 1)
    : [user]
  const selected = new Set(selectedIds.value)
  for (const item of range) {
    if (checked) selected.add(item.id)
    else selected.delete(item.id)
  }
  selectedIds.value = [...selected]
  selectionAnchor = user.id
}

function clearSelection() {
  selectedIds.value = []
  selectionAnchor = null
}

async function applyBulkAction() {
  const targets = [...selectedUsers.value]
  const action = bulkAction.value
  if (bulkBusy.value || !targets.length || !bulkActions.value.includes(action)) return
  bulkBusy.value = true
  try {
    const confirmed = await confirmAction(t('admin.users.bulk.confirm', {
      action: t(`admin.users.bulk.actions.${action}`),
      count: targets.length,
      users: targets.map((user) => user.username).join(', '),
    }), { danger: action === 'delete' || action === 'disable' || action === 'revokeSessions' })
    if (!confirmed) return
    bulkErrors.value = []
    const result = await runUserBatch(targets, (user) => {
      if (action === 'delete') return deleteAdminUser(user.id)
      if (action === 'revokeSessions') return revokeAdminUserSessions(user.id)
      return updateAdminUser(user.id, bulkChanges.value[action])
    })
    selectedIds.value = result.failed.map(({ user }) => user.id)
    bulkErrors.value = result.failed.map(({ user, error }) => ({
      name: user.username,
      message: describeRequestError(error, t('admin.users.bulk.error')),
    }))
    if (result.failed.length) {
      notify.error(t('admin.users.bulk.partial', { succeeded: result.succeeded.length, failed: result.failed.length }))
    } else {
      notify.success(t('admin.users.bulk.success', { count: result.succeeded.length }))
      bulkAction.value = ''
    }
    await load()
  } finally {
    bulkBusy.value = false
  }
}

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
      settingsValues.value = settings
      selectionAnchor = null
      selectedIds.value = selectedIds.value.filter((id) => list.some((user) => user.id === id && !user.current))
      registrationEnabled.value = settings.find((setting) => setting.key === 'registration_enabled')?.value !== false
      const host = settings.find((setting) => setting.key === 'smtp_host')?.value
      smtpConfigured.value = Boolean(mail?.outboundReady) || (typeof host === 'string' && host.trim() !== '')
      const policy = settings.find((setting) => setting.key === 'original_quality_access')?.value
      originalAccess.value = policy === 'everyone' || policy === 'nobody' ? policy : 'admins'
      restrictedDisplay.value = settings.find((setting) => setting.key === 'restricted_media_display')?.value === 'locked' ? 'locked' : 'hidden'
      verificationEnabled.value = settings.find((setting) => setting.key === 'email_verification_required')?.value !== false
      quickConnectEnabled.value = settings.find((setting) => setting.key === 'quick_connect_enabled')?.value === true
      loadError.value = ''
    }
  } finally {
    isLoading.value = false
  }
}

async function openEdit(user: AdminUser) {
  const refresh = await openModal<boolean>(EditUserModal, { props: { user, standalone: props.standalone } }).catch(() => false)
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

async function setQuickConnect(enabled: boolean) {
  if (isLoading.value || isSavingQuickConnect.value) return
  const previous = quickConnectEnabled.value
  quickConnectEnabled.value = enabled
  isSavingQuickConnect.value = true
  try {
    const [error] = await catchError(updateSetting('quick_connect_enabled', enabled))
    if (error) {
      quickConnectEnabled.value = previous
      notify.error(describeRequestError(error, t('admin.users.quickConnectSaveError')))
    }
  } finally {
    isSavingQuickConnect.value = false
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
        <input v-model="query" type="search" :placeholder="t('admin.users.searchPlaceholder')" :disabled="bulkBusy" class="rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm" />
        <button type="button" :class="primaryButton" :disabled="bulkBusy" @click="openCreate">{{ t('admin.users.addUser') }}</button>
      </template>

      <p v-if="loadError" role="alert" class="mb-3 text-sm text-red-300">{{ loadError }}</p>
      <div v-if="selectedUsers.length" class="mb-3 flex flex-wrap items-center gap-2 border-b border-flixer-border pb-3">
        <span class="mr-2 text-sm font-semibold" aria-live="polite">{{ t('admin.users.bulk.selected', { count: selectedUsers.length }) }}</span>
        <select v-model="bulkAction" :aria-label="t('admin.users.bulk.action')" :disabled="bulkBusy" class="rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm disabled:opacity-60">
          <option value="">{{ t('admin.users.bulk.chooseAction') }}</option>
          <option v-for="action in bulkActions" :key="action" :value="action">{{ t(`admin.users.bulk.actions.${action}`) }}</option>
        </select>
        <button type="button" :class="primaryButton" :disabled="bulkBusy || !bulkAction" @click="applyBulkAction">{{ bulkBusy ? t('admin.users.bulk.applying') : t('admin.users.bulk.apply') }}</button>
        <button type="button" :class="secondaryButton" :disabled="bulkBusy" @click="clearSelection">{{ t('admin.users.bulk.clear') }}</button>
      </div>
      <div v-if="bulkErrors.length" role="alert" class="mb-3 text-sm text-red-300">
        <p>{{ t('admin.users.bulk.failedUsers') }}</p>
        <ul class="mt-1 list-inside list-disc"><li v-for="failure in bulkErrors" :key="failure.name">{{ failure.name }}: {{ failure.message }}</li></ul>
      </div>
      <AdminSkeleton v-if="isLoading" variant="table" :rows="3" />
      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-160 text-left text-sm">
          <thead class="text-xs text-flixer-muted">
            <tr>
              <th class="w-10 pb-2"><input type="checkbox" :checked="allVisibleSelected" :indeterminate="someVisibleSelected && !allVisibleSelected" :disabled="bulkBusy || !selectableVisible.length" :aria-label="t('admin.users.bulk.selectVisible')" class="accent-flixer-accent" @change="selectVisible" /></th>
              <th class="pb-2 font-medium">{{ t('admin.users.user') }}</th>
              <th class="pb-2 font-medium">{{ t('admin.users.accountOrigin') }}</th>
              <th class="pb-2 font-medium">{{ t('admin.users.role') }}</th>
              <th class="pb-2 font-medium">{{ t('admin.users.status') }}</th>
              <th class="pb-2 font-medium">{{ t('admin.users.passkeys') }}</th>
              <th class="pb-2 font-medium">{{ t('admin.users.lastActive') }}</th>
              <th class="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filtered" :key="user.id" class="border-t border-flixer-border">
              <td><input type="checkbox" :checked="selectedIds.includes(user.id)" :value="user.id" :disabled="bulkBusy || user.current" :aria-label="t('admin.users.bulk.selectUser', { name: user.username })" :title="user.current ? t('admin.users.bulk.currentAccount') : undefined" class="accent-flixer-accent" @click="selectUser(user, $event)" /></td>
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
                <div class="flex flex-wrap items-center gap-1.5">
                  <StatusPill v-if="user.invited" tone="accent">{{ t('admin.users.invitedBadge') }}</StatusPill>
                  <StatusPill :tone="user.invite && user.invite.serverType !== 'flixer' ? 'good' : 'neutral'">{{ accountServerLabel(user) }}</StatusPill>
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
                  <button v-if="!props.standalone" type="button" :class="secondaryButton" :disabled="bulkBusy" class="inline-flex items-center gap-1.5" :aria-label="t('admin.access.manage', { name: user.displayName })" @click="openAccess(user)"><Icon icon="lucide:shield-check" class="size-3.5" aria-hidden="true" />{{ t('admin.access.manageShort') }}</button>
                  <button v-if="payments.active.value" type="button" :class="secondaryButton" :disabled="bulkBusy" class="inline-flex items-center gap-1.5" :aria-label="t('payments.admin.userPayments.manage', { name: user.displayName || user.username })" @click="openPayments(user)"><Icon icon="lucide:credit-card" class="size-3.5" aria-hidden="true" />{{ t('payments.admin.userPayments.button') }}</button>
                  <button type="button" :class="secondaryButton" :disabled="bulkBusy" @click="openEdit(user)">{{ t('admin.users.edit') }}</button>
                </div>
              </td>
            </tr>
            <tr v-if="filtered.length === 0">
              <td colspan="8" class="py-6 text-center text-flixer-muted">{{ users.length === 0 ? t('admin.users.noUsers') : t('admin.users.noSearchMatches') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </AdminSection>

    <LoginSecuritySection :settings="settingsValues" :loading="isLoading" />

    <AdminSection v-if="!props.standalone" :title="t('admin.users.signUpPolicy')" :description="t('admin.users.signUpPolicyDescription')">
      <AdminToggle :model-value="registrationEnabled" :label="t('admin.users.allowPublicRegistration')" :description="t('admin.users.publicRegistrationDescription')" @update:model-value="setRegistration" />
      <div :class="{ 'pointer-events-none opacity-60': !smtpConfigured }">
        <AdminToggle :model-value="verificationEnabled" :label="t('admin.users.requireEmailVerification')" :description="smtpConfigured ? t('admin.users.requireEmailVerificationDescription') : t('admin.users.emailVerificationOff')" @update:model-value="setVerification" />
      </div>
    </AdminSection>

    <AdminSection v-if="!props.standalone" :title="t('admin.users.quickConnectTitle')" :description="t('admin.users.quickConnectDescription')">
      <AdminToggle :model-value="quickConnectEnabled" :label="t('admin.users.quickConnectEnable')" :description="t('admin.users.quickConnectEnableDescription')" :disabled="isLoading || isSavingQuickConnect" @update:model-value="setQuickConnect" />
    </AdminSection>

    <AdminSection v-if="!props.standalone" :title="t('admin.access.displayTitle')" :description="t('admin.access.displayDescription')">
      <div class="grid gap-2 sm:grid-cols-2">
        <button v-for="mode in ['hidden', 'locked'] as const" :key="mode" type="button" class="flex items-start gap-3 rounded border p-3 text-left transition focus-visible:outline-2 focus-visible:outline-flixer-accent" :class="restrictedDisplay === mode ? 'border-flixer-primary bg-flixer-primary/10' : 'border-flixer-border hover:bg-white/5'" :aria-pressed="restrictedDisplay === mode" @click="setRestrictedDisplay(mode)">
          <Icon :icon="mode === 'hidden' ? 'lucide:eye-off' : 'lucide:lock'" class="mt-0.5 size-5 shrink-0" :class="restrictedDisplay === mode ? 'text-flixer-accent' : 'text-flixer-muted'" aria-hidden="true" />
          <span><span class="block text-sm font-semibold">{{ t(`admin.access.display.${mode}`) }}</span><span class="mt-0.5 block text-xs text-flixer-muted">{{ t(`admin.access.display.${mode}Description`) }}</span></span>
        </button>
      </div>
    </AdminSection>

    <AdminSection v-if="!props.standalone" :title="t('admin.users.originalAccess')" :description="t('admin.users.originalAccessDescription')">
      <select :value="originalAccess" class="w-full max-w-xs rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm" @change="setOriginalAccess(($event.target as HTMLSelectElement).value)">
        <option value="admins">{{ t('admin.users.originalAccessAdmins') }}</option>
        <option value="everyone">{{ t('admin.users.originalAccessEveryone') }}</option>
        <option value="nobody">{{ t('admin.users.originalAccessNobody') }}</option>
      </select>
    </AdminSection>
  </div>
</template>
