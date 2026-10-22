<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AVATAR_TYPES, MAX_AVATAR_BYTES, deleteAdminUser, removeAdminUserAvatar, revokeAdminUserSessions, setAdminUserAvatar, setAdminUserPassword, updateAdminUser, type AdminUser } from '../../api'
import { confirmAction } from '../../composables/confirm'
import { notify } from '../../composables/notify'
import { describeRequestError, useProfile } from '../../composables/useProfile'
import TextInput from '../ui/TextInput.vue'
import UserAvatar from '../ui/UserAvatar.vue'
import AdminToggle from './AdminToggle.vue'

defineOptions({ modalGroup: 'default' })

const props = defineProps<{ user: AdminUser }>()

// Resolves true when the user list needs a refresh.
const { close, confirm } = useModalContext<boolean>()
const { t } = useI18n()

const busy = ref(false)
const changed = ref(false)
const avatarUrl = ref(props.user.avatarUrl)
const fileInput = ref<HTMLInputElement | null>(null)
const { load: reloadProfile } = useProfile()
const activeSessions = ref(props.user.activeSessions)
const form = reactive({ displayName: props.user.displayName, email: props.user.email ?? '', role: props.user.role, enabled: !props.user.disabled, newPassword: '' })
const canSave = computed(() => !busy.value && form.displayName.trim() !== '')

const secondaryButton = 'flex h-11 items-center justify-center rounded-lg border border-flixer-border px-5 text-sm font-semibold text-flixer-text transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:opacity-60'
const dangerButton = 'flex h-11 items-center justify-center rounded-lg border border-rose-400/40 px-5 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300 disabled:opacity-60'

async function run<T>(action: () => Promise<T>, errorKey: string): Promise<T | undefined> {
  busy.value = true
  try {
    return await action()
  } catch (error: unknown) {
    console.error('[users]', errorKey, error)
    notify.error(describeRequestError(error, t(errorKey)))
    return undefined
  } finally {
    busy.value = false
  }
}

async function applyAvatar(action: () => Promise<AdminUser>, successKey: string, errorKey: string) {
  const updated = await run(action, errorKey)
  if (!updated) return
  avatarUrl.value = updated.avatarUrl
  changed.value = true
  notify.success(t(successKey))
  if (props.user.current) void reloadProfile(true)
}

async function handleFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!AVATAR_TYPES.includes(file.type)) {
    notify.error(t('settings.avatar.invalidType'))
    return
  }
  if (file.size > MAX_AVATAR_BYTES) {
    notify.error(t('settings.avatar.tooLarge'))
    return
  }
  await applyAvatar(() => setAdminUserAvatar(props.user.id, file), 'settings.avatar.updated', 'settings.avatar.uploadFailed')
}

async function removeAvatar() {
  await applyAvatar(() => removeAdminUserAvatar(props.user.id), 'settings.avatar.removed', 'settings.avatar.removeFailed')
}

async function save() {
  const changes: Parameters<typeof updateAdminUser>[1] = {}
  if (form.displayName.trim() !== props.user.displayName) changes.displayName = form.displayName.trim()
  if (form.email.trim().toLowerCase() !== (props.user.email ?? '')) changes.email = form.email.trim()
  if (!props.user.current) {
    if (form.role !== props.user.role) changes.role = form.role
    if (form.enabled === props.user.disabled) changes.disabled = !form.enabled
  }
  if (Object.keys(changes).length === 0) {
    confirm(changed.value)
    return
  }
  const updated = await run(() => updateAdminUser(props.user.id, changes), 'admin.users.saveError')
  if (!updated) return
  notify.success(t('admin.users.saved', { name: updated.displayName }))
  confirm(true)
}

async function savePassword() {
  if (form.newPassword.length < 8) {
    notify.error(t('admin.users.passwordTooShort'))
    return
  }
  const done = await run(() => setAdminUserPassword(props.user.id, form.newPassword).then(() => true), 'admin.users.passwordError')
  if (!done) return
  form.newPassword = ''
  activeSessions.value = 0
  changed.value = true
  notify.success(t('admin.users.passwordSaved'))
}

async function revokeSessions() {
  if (!(await confirmAction(t('admin.users.confirmRevoke', { name: props.user.displayName }), { danger: true }))) return
  const result = await run(() => revokeAdminUserSessions(props.user.id), 'admin.users.sessionsError')
  if (!result) return
  activeSessions.value = 0
  changed.value = true
  notify.success(t('admin.users.sessionsRevoked', { count: result.revoked }))
}

async function remove() {
  if (!(await confirmAction(t('admin.users.confirmDelete', { name: props.user.displayName }), { danger: true }))) return
  const done = await run(() => deleteAdminUser(props.user.id).then(() => true), 'admin.users.deleteError')
  if (!done) return
  notify.success(t('admin.users.deleted', { name: props.user.displayName }))
  confirm(true)
}
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col rounded-2xl border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <ModalTitle class="shrink-0 text-lg font-semibold">{{ t('admin.users.editTitle', { name: user.displayName }) }}</ModalTitle>
      <ModalDescription class="mt-1 shrink-0 text-sm leading-6 text-flixer-muted">{{ t('admin.users.editDescription') }}</ModalDescription>

      <div class="mt-5 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div class="flex items-center gap-4">
          <button type="button" class="group relative size-16 shrink-0 overflow-hidden rounded-xl text-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-wait" :aria-label="t('settings.avatar.changeLabel')" :disabled="busy" @click="fileInput?.click()">
            <UserAvatar :avatar-url="avatarUrl" :name="user.displayName" />
            <span class="absolute inset-0 grid place-items-center bg-black/55 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">{{ busy ? t('settings.avatar.working') : t('settings.avatar.change') }}</span>
          </button>
          <div class="flex flex-col gap-2">
            <div class="flex flex-wrap gap-2">
              <button type="button" :class="[secondaryButton, 'h-10 px-4']" :disabled="busy" @click="fileInput?.click()">{{ avatarUrl ? t('settings.avatar.changePicture') : t('settings.avatar.uploadPicture') }}</button>
              <button v-if="avatarUrl" type="button" :class="[dangerButton, 'h-10 border-transparent px-4']" :disabled="busy" @click="removeAvatar">{{ t('settings.avatar.remove') }}</button>
            </div>
            <p class="text-xs text-flixer-muted">{{ t('settings.avatar.fileRequirements') }}</p>
          </div>
          <input ref="fileInput" type="file" class="hidden" accept="image/png,image/jpeg,image/webp,image/gif" @change="handleFile" />
        </div>

        <form id="edit-user-form" class="flex flex-col gap-4" @submit.prevent="save">
          <TextInput v-model="form.displayName" :label="t('admin.users.displayName')" name="displayName" maxlength="64" required />
          <TextInput v-model="form.email" :label="t('admin.users.email')" type="email" name="email" maxlength="254" autocomplete="off" />
          <p class="text-xs text-flixer-muted">{{ t('admin.users.username') }}: {{ user.username }}</p>
        </form>

        <div>
          <p class="text-xs font-semibold text-flixer-muted">{{ t('admin.users.access') }}</p>
          <p v-if="user.current" class="mt-1 text-xs text-flixer-muted">{{ t('admin.users.ownAccountNote') }}</p>
          <div :class="{ 'pointer-events-none opacity-60': user.current }">
            <AdminToggle :model-value="form.role === 'admin'" :label="t('admin.users.administrator')" :description="t('admin.users.fullDashboardAccess')" @update:model-value="form.role = $event ? 'admin' : 'user'" />
            <AdminToggle v-model="form.enabled" :label="t('admin.users.accountEnabled')" :description="t('admin.users.accountEnabledDescription')" />
          </div>
        </div>

        <div class="border-t border-flixer-border pt-4">
          <p class="text-xs font-semibold text-flixer-muted">{{ t('admin.users.accountSection') }}</p>
          <form class="mt-2 flex items-end gap-3" @submit.prevent="savePassword">
            <TextInput v-model="form.newPassword" :label="t('admin.users.newPassword')" type="password" name="newPassword" minlength="8" maxlength="128" autocomplete="new-password" class="flex-1" />
            <button type="submit" :class="[secondaryButton, 'h-12 shrink-0']" :disabled="busy || !form.newPassword">{{ t('admin.users.setPassword') }}</button>
          </form>
          <div class="mt-3 flex flex-wrap gap-3">
            <button type="button" :class="secondaryButton" :disabled="busy" @click="revokeSessions">{{ t('admin.users.revokeSessions') }}</button>
            <button v-if="!user.current" type="button" :class="dangerButton" :disabled="busy" @click="remove">{{ t('admin.users.deleteUser') }}</button>
          </div>
          <p class="mt-2 text-xs text-flixer-muted">{{ t('admin.users.activeSessions', { count: activeSessions }) }}</p>
        </div>
      </div>

      <div class="mt-5 flex shrink-0 flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" :class="secondaryButton" :disabled="busy" @click="changed ? confirm(true) : close()">{{ t('common.cancel') }}</button>
        <button type="submit" form="edit-user-form" class="flex h-11 items-center justify-center rounded-lg bg-flixer-primary px-6 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:opacity-60" :disabled="!canSave">{{ t('common.save') }}</button>
      </div>
    </ModalContent>
  </ModalRoot>
</template>
