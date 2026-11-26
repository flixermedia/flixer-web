<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import logo from '../../resources/logo/flixer-logo.svg'
import { completeCloudConnect } from '../api/cloud'
import { notify } from '../composables/notify'
import { describeRequestError } from '../composables/useProfile'
import { catchError } from '../utils/catchError'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const status = ref<'loading' | 'error'>('loading')
const errorMessage = ref('')

onMounted(async () => {
  const oauthError = typeof route.query.error === 'string' ? route.query.error : ''
  if (oauthError) {
    status.value = 'error'
    errorMessage.value = oauthError === 'access_denied'
      ? t('admin.cloud.callbackCanceled')
      : t('admin.cloud.callbackError', { error: oauthError })
    return
  }

  const code = typeof route.query.code === 'string' ? route.query.code : ''
  const state = typeof route.query.state === 'string' ? route.query.state : ''
  if (!code || !state) {
    status.value = 'error'
    errorMessage.value = t('admin.cloud.callbackMissingParams')
    return
  }

  const [error] = await catchError(completeCloudConnect(code, state))
  if (error) {
    status.value = 'error'
    errorMessage.value = describeRequestError(error, t('admin.cloud.callbackCompleteFailed'))
    return
  }

  notify.success(t('admin.cloud.callbackSuccess'))
  await router.replace({ name: 'admin', query: { tab: 'cloud' } })
})
</script>

<template>
  <main class="grid min-h-screen place-items-center bg-flixer-background px-6 font-sans text-flixer-text">
    <div class="w-full max-w-md rounded border border-flixer-border/70 bg-flixer-surface/70 p-8 text-center shadow-2xl">
      <img :src="logo" alt="" class="mx-auto size-14 rounded shadow-lg" aria-hidden="true" />

      <template v-if="status === 'loading'">
        <h1 class="mt-6 text-2xl font-semibold tracking-tight">
          {{ t('admin.cloud.callbackTitle') }}<span class="text-flixer-accent">.</span>
        </h1>
        <p class="mt-2 text-sm text-flixer-muted">
          {{ t('admin.cloud.callbackSubtitle') }}
        </p>
        <span
          class="mx-auto mt-6 block size-6 animate-spin rounded-full border-2 border-white/20 border-t-flixer-accent"
          aria-hidden="true"
        ></span>
      </template>

      <template v-else>
        <h1 class="mt-6 text-2xl font-semibold tracking-tight">
          {{ t('admin.cloud.callbackFailedTitle') }}<span class="text-flixer-accent">.</span>
        </h1>
        <p class="mt-2 text-sm text-red-300">{{ errorMessage }}</p>
        <RouterLink
          :to="{ name: 'admin', query: { tab: 'cloud' } }"
          class="mt-8 flex h-12 w-full items-center justify-center rounded bg-gradient-to-r from-flixer-primary to-flixer-secondary text-sm font-semibold text-white shadow-lg shadow-flixer-primary/20 transition hover:brightness-110"
        >
          {{ t('admin.cloud.backToCloud') }}
        </RouterLink>
      </template>
    </div>
  </main>
</template>
