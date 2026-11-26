<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { toast } from 'vue3-toastify'
import { useOnlineStatus } from '../../composables/useOnlineStatus'

const OFFLINE_TOAST_ID = 'flixer-offline'
const AUTH_ROUTE_NAMES = new Set(['login', 'register', 'oauth-sign-in', 'external-auth-callback'])

const route = useRoute()
const { isOnline } = useOnlineStatus()
const { t } = useI18n()

function syncOfflineToast() {
  const onAuthRoute = AUTH_ROUTE_NAMES.has(String(route.name ?? ''))
  if (!isOnline.value && !onAuthRoute) {
    if (!toast.isActive(OFFLINE_TOAST_ID)) {
      toast.warning(t('ui.offlineBanner'), {
        toastId: OFFLINE_TOAST_ID,
        toastClassName: 'flixer-toast flixer-toast--offline',
        autoClose: false,
        closeOnClick: false,
        closeButton: false,
        clearOnUrlChange: false,
        role: 'status',
      })
    }
    return
  }
  toast.remove(OFFLINE_TOAST_ID)
}

watch([isOnline, () => route.name], syncOfflineToast, { immediate: true })

onBeforeUnmount(() => {
  toast.remove(OFFLINE_TOAST_ID)
})
</script>

<template></template>
