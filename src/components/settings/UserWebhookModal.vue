<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { saveUserWebhook, type UserWebhook } from '../../api/userWebhooks'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import TextInput from '../ui/TextInput.vue'

defineOptions({ modalGroup: 'default' })

const props = defineProps<{ hook?: UserWebhook }>()
const { close, confirm, onBeforeClose } = useModalContext<UserWebhook>()
const { t } = useI18n()
const form = ref(props.hook
  ? { name: props.hook.name, url: props.hook.url, enabled: props.hook.enabled }
  : { name: '', url: '', enabled: true })
const busy = ref(false)
onBeforeClose(() => !busy.value)

async function save() {
  if (busy.value) return
  busy.value = true
  const [error, saved] = await catchError(saveUserWebhook(form.value, props.hook?.id))
  busy.value = false
  if (error) notify.error(describeRequestError(error, t('webhooks.saveError')))
  else {
    notify.success(t('webhooks.saved'))
    confirm(saved)
  }
}
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card w-full max-w-lg rounded border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <header class="flixer-modal-header">
        <ModalTitle class="text-lg font-semibold">{{ hook ? t('webhooks.editTitle') : t('webhooks.createTitle') }}</ModalTitle>
        <ModalDescription class="mt-1 text-sm leading-6 text-flixer-muted">{{ t('webhooks.approvedHint') }}</ModalDescription>
      </header>
      <form class="flixer-modal-form mt-5" @submit.prevent="save">
        <div class="flixer-modal-form-body gap-5">
          <TextInput v-model="form.name" :label="t('webhooks.name')" maxlength="100" required autofocus />
          <TextInput v-model.trim="form.url" :label="t('webhooks.url')" type="url" maxlength="2048" required />
          <label class="flex items-center gap-2 text-sm"><input v-model="form.enabled" type="checkbox" />{{ t('webhooks.enabled') }}</label>
        </div>
        <div class="flixer-modal-actions flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" class="flex h-11 items-center justify-center rounded border border-flixer-border px-6 text-sm font-semibold text-flixer-text transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" :disabled="busy" @click="close()">{{ t('webhooks.cancel') }}</button>
          <button type="submit" class="flex h-11 items-center justify-center rounded bg-flixer-primary px-6 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-wait disabled:opacity-60" :disabled="busy">{{ hook ? t('webhooks.save') : t('webhooks.create') }}</button>
        </div>
      </form>
    </ModalContent>
  </ModalRoot>
</template>
