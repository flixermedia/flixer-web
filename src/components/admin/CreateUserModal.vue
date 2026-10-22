<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { createAdminUser } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import TextInput from '../ui/TextInput.vue'
import AdminToggle from './AdminToggle.vue'

defineOptions({ modalGroup: 'default' })

const { close, confirm } = useModalContext<boolean>()
const { t } = useI18n()

const busy = ref(false)
const form = reactive({ username: '', displayName: '', email: '', password: '', role: 'user' as 'admin' | 'user' })

async function submit() {
  busy.value = true
  try {
    const created = await createAdminUser({
      username: form.username.trim(),
      displayName: form.displayName.trim() || undefined,
      email: form.email.trim(),
      password: form.password,
      role: form.role,
    })
    notify.success(t('admin.users.created', { name: created.displayName }))
    confirm(true)
  } catch (error: unknown) {
    console.error('[users] create failed', error)
    notify.error(describeRequestError(error, t('admin.users.createError')))
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col rounded-2xl border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <ModalTitle class="shrink-0 text-lg font-semibold">{{ t('admin.users.createTitle') }}</ModalTitle>
      <ModalDescription class="mt-1 shrink-0 text-sm leading-6 text-flixer-muted">{{ t('admin.users.createDescription') }}</ModalDescription>

      <form class="mt-5 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" @submit.prevent="submit">
        <TextInput v-model="form.username" :label="t('admin.users.username')" name="username" required minlength="3" maxlength="64" pattern="[a-zA-Z0-9_.\-]+" autocomplete="off" autofocus />
        <TextInput v-model="form.displayName" :label="t('admin.users.displayName')" name="displayName" maxlength="64" autocomplete="off" />
        <TextInput v-model="form.email" :label="t('admin.users.email')" type="email" name="email" required maxlength="254" autocomplete="off" />
        <TextInput v-model="form.password" :label="t('admin.users.password')" :hint="t('admin.users.passwordHint')" type="password" name="newUserPassword" required minlength="8" maxlength="128" autocomplete="new-password" />
        <AdminToggle :model-value="form.role === 'admin'" :label="t('admin.users.administrator')" :description="t('admin.users.fullDashboardAccess')" @update:model-value="form.role = $event ? 'admin' : 'user'" />

        <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" class="flex h-11 items-center justify-center rounded-lg border border-flixer-border px-6 text-sm font-semibold text-flixer-text transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" :disabled="busy" @click="close()">{{ t('common.cancel') }}</button>
          <button type="submit" class="flex h-11 items-center justify-center rounded-lg bg-flixer-primary px-6 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:opacity-60" :disabled="busy">{{ t('admin.users.create') }}</button>
        </div>
      </form>
    </ModalContent>
  </ModalRoot>
</template>
