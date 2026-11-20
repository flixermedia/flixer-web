<script setup lang="ts">
import { ModalClosedError, openModal } from '@kolirt/vue-modal'
import { Button } from '@ui-sdk/vue/button'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { deleteUserWebhook, getUserWebhooks, type UserWebhook } from '../../api/userWebhooks'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import UserWebhookModal from './UserWebhookModal.vue'

const { t } = useI18n()
const loading = ref(true)
const loadFailed = ref(false)
const busy = ref(false)
const available = ref(false)
const hooks = ref<UserWebhook[]>([])
const removing = ref<string | null>(null)

async function load() {
  loading.value = true
  const [error, result] = await catchError(getUserWebhooks())
  loadFailed.value = Boolean(error)
  if (error) notify.error(describeRequestError(error, t('webhooks.loadError')))
  else { available.value = result.available; hooks.value = result.hooks }
  loading.value = false
}
onMounted(load)

async function edit(hook?: UserWebhook) {
  const [error, saved] = await catchError(openModal<UserWebhook>(UserWebhookModal, { props: { hook } }))
  if (error) {
    if (!(error instanceof ModalClosedError)) {
      console.error('[webhooks] Could not open webhook editor', error)
      notify.error(t('webhooks.editorError'))
    }
    return
  }
  if (hook) hooks.value = hooks.value.map((entry) => entry.id === saved.id ? saved : entry)
  else hooks.value.push(saved)
}
async function remove(id: string) {
  busy.value = true
  const [error] = await catchError(deleteUserWebhook(id))
  if (error) notify.error(describeRequestError(error, t('webhooks.deleteError')))
  else { removing.value = null; await load() }
  busy.value = false
}
</script>

<template>
  <section aria-labelledby="webhooks-heading">
    <h2 id="webhooks-heading" class="text-lg font-semibold">{{ t('webhooks.title') }}</h2>
    <p class="mt-1 text-sm text-flixer-muted">{{ t('webhooks.description') }}</p>
    <p v-if="loading" role="status" class="mt-4 text-sm text-flixer-muted">{{ t('common.loading') }}</p>
    <div v-else-if="loadFailed" role="alert" class="mt-4 space-y-2 text-sm"><p>{{ t('webhooks.loadError') }}</p><Button type="button" class="h-auto border-0 bg-transparent p-0 text-sm text-flixer-accent underline hover:bg-transparent" @click="load">{{ t('webhooks.retry') }}</Button></div>
    <template v-else>
      <p v-if="!available" class="mt-5 rounded border border-flixer-border p-3 text-sm text-flixer-muted">{{ t('webhooks.unavailable') }}</p>
      <p class="mt-4 text-sm text-flixer-muted">{{ t('webhooks.events') }}</p>
      <Button v-if="available" type="button" class="mt-5 h-11 rounded border-0 bg-flixer-primary px-5 text-sm font-semibold text-white transition hover:bg-flixer-primary hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" :disabled="busy" @click="edit()">{{ t('webhooks.create') }}</Button>
      <ul v-if="hooks.length" class="mt-5 divide-y divide-flixer-border rounded border border-flixer-border">
        <li v-for="hook in hooks" :key="hook.id" class="flex flex-wrap items-center justify-between gap-3 p-4">
          <div class="min-w-0"><p class="font-medium">{{ hook.name }}</p><p class="break-all text-xs text-flixer-muted">{{ hook.url }}</p><p class="text-xs text-flixer-muted">{{ hook.enabled ? t('webhooks.enabled') : t('webhooks.disabled') }}</p></div>
          <div class="flex flex-wrap gap-2">
            <Button type="button" :aria-label="`${t('webhooks.edit')}: ${hook.name}`" class="h-auto rounded border-0 bg-white/10 px-3 py-2 text-xs font-semibold text-flixer-text hover:bg-white/10" :disabled="busy || !available" @click="edit(hook)">{{ t('webhooks.edit') }}</Button>
            <Button v-if="removing !== hook.id" type="button" :aria-label="`${t('webhooks.delete')}: ${hook.name}`" class="h-auto rounded border-0 bg-red-500/20 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/20" :disabled="busy" @click="removing = hook.id">{{ t('webhooks.delete') }}</Button>
            <template v-else><Button type="button" :aria-label="`${t('webhooks.confirmDelete')}: ${hook.name}`" :data-agent-confirm="`${t('webhooks.confirmDelete')}: ${hook.name}`" class="h-auto rounded border-0 bg-red-500/20 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/20" :disabled="busy" @click="remove(hook.id)">{{ t('webhooks.confirmDelete') }}</Button><Button type="button" :aria-label="`${t('webhooks.cancel')}: ${hook.name}`" class="h-auto rounded border-0 bg-white/10 px-3 py-2 text-xs text-flixer-text hover:bg-white/10" @click="removing = null">{{ t('webhooks.cancel') }}</Button></template>
          </div>
        </li>
      </ul>
    </template>
  </section>
</template>
