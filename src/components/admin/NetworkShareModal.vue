<script setup lang="ts">
import { ModalContent, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { createNetworkShare, updateNetworkShare, type NetworkShare, type NetworkShareProtocol } from '../../api'
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
const protocol = ref<NetworkShareProtocol>(props.share?.protocol ?? 'smb')
const host = ref(props.share?.host ?? '')
const shareName = ref(props.share?.share ?? '')
const username = ref(props.share?.username ?? '')
const domain = ref(props.share?.domain ?? '')
const region = ref(props.share?.region ?? 'us-east-1')
const password = ref('')
const readOnly = ref(props.share?.readOnly ?? true)

const protocols: Array<{ value: NetworkShareProtocol; label: string }> = [
  { value: 'smb', label: 'SMB' },
  { value: 'nfs', label: 'NFS' },
  { value: 'webdav', label: 'WebDAV' },
  { value: 's3', label: 'S3-compatible / MinIO' },
]

function onProtocolChange() {
  if (protocol.value !== 'smb') readOnly.value = true
}

async function save() {
  saving.value = true
  formError.value = ''
  const input = {
    name: name.value.trim(),
    protocol: protocol.value,
    host: host.value.trim(),
    share: shareName.value.trim(),
    username: protocol.value === 'nfs' ? '' : username.value.trim(),
    domain: protocol.value === 'smb' ? domain.value.trim() : '',
    region: protocol.value === 's3' ? region.value.trim() : '',
    readOnly: protocol.value === 'smb' ? readOnly.value : true,
  }
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
      <header class="flixer-modal-header">
        <ModalTitle class="shrink-0 text-lg font-semibold">{{ share ? t('admin.networkShares.editTitle') : t('admin.networkShares.addTitle') }}</ModalTitle>
      </header>
      <form class="flixer-modal-form mt-5" @submit.prevent="save">
        <div class="flixer-modal-form-body gap-4">
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="flex flex-col gap-1 text-xs text-flixer-muted">
              {{ t('admin.networkShares.name') }}
              <input v-model="name" type="text" maxlength="100" required :placeholder="t('admin.networkShares.namePlaceholder')" class="rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm text-flixer-text" />
            </label>
            <label class="flex flex-col gap-1 text-xs text-flixer-muted">
              {{ t('admin.networkShares.protocol') }}
              <select v-model="protocol" class="rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm text-flixer-text" @change="onProtocolChange">
                <option v-for="item in protocols" :key="item.value" :value="item.value">{{ item.label }}</option>
              </select>
            </label>
            <label class="flex flex-col gap-1 text-xs text-flixer-muted">
              {{ protocol === 'webdav' || protocol === 's3' ? t('admin.networkShares.endpoint') : t('admin.networkShares.host') }}
              <input v-model="host" type="text" maxlength="255" required autocapitalize="none" :placeholder="protocol === 'smb' ? t('admin.networkShares.hostPlaceholder') : protocol === 'nfs' ? 'nas.local' : protocol === 'webdav' ? 'https://dav.example.com' : 'http://minio.local:9000'" class="rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm text-flixer-text" />
            </label>
            <label class="flex flex-col gap-1 text-xs text-flixer-muted">
              {{ protocol === 'nfs' ? t('admin.networkShares.nfsExport') : protocol === 'webdav' ? t('admin.networkShares.remotePath') : protocol === 's3' ? t('admin.networkShares.bucketPath') : t('admin.networkShares.share') }}
              <input v-model="shareName" type="text" maxlength="255" required autocapitalize="none" :placeholder="protocol === 'nfs' ? '/exports/media' : protocol === 'webdav' ? '/remote.php/dav/files/user' : protocol === 's3' ? 'movies/library' : t('admin.networkShares.sharePlaceholder')" class="rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm text-flixer-text" />
            </label>
            <label v-if="protocol !== 'nfs'" class="flex flex-col gap-1 text-xs text-flixer-muted">
              {{ protocol === 's3' ? t('admin.networkShares.accessKey') : t('admin.networkShares.username') }}
              <input v-model="username" type="text" maxlength="255" autocomplete="off" autocapitalize="none" :required="protocol === 's3'" class="rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm text-flixer-text" />
              <span v-if="protocol === 'smb'">{{ t('admin.networkShares.usernameHint') }}</span>
            </label>
            <label v-if="protocol !== 'nfs'" class="flex flex-col gap-1 text-xs text-flixer-muted">
              {{ protocol === 's3' ? t('admin.networkShares.secretKey') : t('admin.networkShares.password') }}
              <input v-model="password" type="password" maxlength="512" autocomplete="new-password" :required="protocol === 's3' && (!share || share.protocol !== 's3' || !share.hasPassword)" :placeholder="share?.hasPassword && share.protocol === protocol ? t('admin.networkShares.passwordKeep') : ''" class="rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm text-flixer-text" />
            </label>
            <label v-if="protocol === 'smb'" class="flex flex-col gap-1 text-xs text-flixer-muted">
              {{ t('admin.networkShares.domain') }}
              <input v-model="domain" type="text" maxlength="64" autocomplete="off" autocapitalize="none" class="rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm text-flixer-text" />
            </label>
            <label v-if="protocol === 's3'" class="flex flex-col gap-1 text-xs text-flixer-muted">
              {{ t('admin.networkShares.region') }}
              <input v-model="region" type="text" maxlength="64" autocapitalize="none" placeholder="us-east-1" class="rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm text-flixer-text" />
            </label>
          </div>
          <label v-if="protocol === 'smb'" class="flex flex-col gap-1 text-xs text-flixer-muted">
            <span class="flex items-center gap-2 text-sm text-flixer-text"><input v-model="readOnly" type="checkbox" /> {{ t('admin.networkShares.readOnly') }}</span>
            <span>{{ t('admin.networkShares.readOnlyHint') }}</span>
          </label>
          <p v-else class="text-xs text-flixer-muted">{{ t('admin.networkShares.remoteReadOnly') }}</p>
          <p v-if="formError" role="alert" class="text-sm text-red-300">{{ formError }}</p>
        </div>
        <div class="flixer-modal-actions flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" :disabled="saving" class="h-11 rounded border border-flixer-border px-6 text-sm font-semibold transition hover:bg-white/5" @click="close()">{{ t('admin.networkShares.cancel') }}</button>
          <button type="submit" :disabled="saving" class="h-11 rounded bg-flixer-primary px-6 text-sm font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-50">{{ saving ? t('admin.networkShares.saving') : t('admin.networkShares.save') }}</button>
        </div>
      </form>
    </ModalContent>
  </ModalRoot>
</template>
