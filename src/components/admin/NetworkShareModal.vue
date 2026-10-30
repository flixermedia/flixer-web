<script setup lang="ts">
import { ModalContent, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { createNetworkShare, updateNetworkShare, type NetworkShare } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'

defineOptions({ modalGroup: 'default' })

const props = defineProps<{ share?: NetworkShare }>()

const { close, confirm } = useModalContext<boolean>()
const { t } = useI18n()

const saving = ref(false)
const formError = ref('')
const name = ref(props.share?.name ?? '')
const host = ref(props.share?.host ?? '')
const shareName = ref(props.share?.share ?? '')
const username = ref(props.share?.username ?? '')
const domain = ref(props.share?.domain ?? '')
const password = ref('')
const readOnly = ref(props.share?.readOnly ?? true)

async function save() {
  saving.value = true
  formError.value = ''
  const input = { name: name.value.trim(), host: host.value.trim(), share: shareName.value.trim(), username: username.value.trim(), domain: domain.value.trim(), readOnly: readOnly.value }
  try {
    if (props.share) {
      const [error] = await catchError(updateNetworkShare(props.share.id, password.value ? { ...input, password: password.value } : input))
      if (error) {
        formError.value = describeRequestError(error, t('admin.networkShares.saveError'))
        return
      }
    } else {
      const [error] = await catchError(createNetworkShare({ ...input, password: password.value }))
      if (error) {
        formError.value = describeRequestError(error, t('admin.networkShares.saveError'))
        return
      }
    }
    notify.success(t(props.share ? 'admin.networkShares.updated' : 'admin.networkShares.created'))
    confirm(true)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col rounded border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <ModalTitle class="shrink-0 text-lg font-semibold">{{ share ? t('admin.networkShares.editTitle') : t('admin.networkShares.addTitle') }}</ModalTitle>
      <form class="mt-5 grid min-h-0 flex-1 gap-4 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" @submit.prevent="save">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="flex flex-col gap-1 text-xs text-flixer-muted">
            {{ t('admin.networkShares.name') }}
            <input v-model="name" type="text" maxlength="100" required :placeholder="t('admin.networkShares.namePlaceholder')" class="rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm text-flixer-text" />
          </label>
          <label class="flex flex-col gap-1 text-xs text-flixer-muted">
            {{ t('admin.networkShares.host') }}
            <input v-model="host" type="text" maxlength="255" required autocapitalize="none" :placeholder="t('admin.networkShares.hostPlaceholder')" class="rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm text-flixer-text" />
          </label>
          <label class="flex flex-col gap-1 text-xs text-flixer-muted">
            {{ t('admin.networkShares.share') }}
            <input v-model="shareName" type="text" maxlength="255" required autocapitalize="none" :placeholder="t('admin.networkShares.sharePlaceholder')" class="rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm text-flixer-text" />
          </label>
          <label class="flex flex-col gap-1 text-xs text-flixer-muted">
            {{ t('admin.networkShares.username') }}
            <input v-model="username" type="text" maxlength="255" autocomplete="off" autocapitalize="none" class="rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm text-flixer-text" />
            <span>{{ t('admin.networkShares.usernameHint') }}</span>
          </label>
          <label class="flex flex-col gap-1 text-xs text-flixer-muted">
            {{ t('admin.networkShares.password') }}
            <input v-model="password" type="password" maxlength="512" autocomplete="new-password" :placeholder="share?.hasPassword ? t('admin.networkShares.passwordKeep') : ''" class="rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm text-flixer-text" />
          </label>
          <label class="flex flex-col gap-1 text-xs text-flixer-muted">
            {{ t('admin.networkShares.domain') }}
            <input v-model="domain" type="text" maxlength="64" autocomplete="off" autocapitalize="none" class="rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm text-flixer-text" />
          </label>
        </div>
        <label class="flex flex-col gap-1 text-xs text-flixer-muted">
          <span class="flex items-center gap-2 text-sm text-flixer-text"><input v-model="readOnly" type="checkbox" /> {{ t('admin.networkShares.readOnly') }}</span>
          <span>{{ t('admin.networkShares.readOnlyHint') }}</span>
        </label>
        <p v-if="formError" role="alert" class="text-sm text-red-300">{{ formError }}</p>
        <div class="flex gap-2">
          <button type="submit" :disabled="saving" class="rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-50">{{ saving ? t('admin.networkShares.saving') : t('admin.networkShares.save') }}</button>
          <button type="button" :disabled="saving" class="rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15" @click="close()">{{ t('admin.networkShares.cancel') }}</button>
        </div>
      </form>
    </ModalContent>
  </ModalRoot>
</template>
