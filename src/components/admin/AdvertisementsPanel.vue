<script setup lang="ts">
import { openModal } from '@kolirt/vue-modal'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { deleteAdvertisement, getAdvertisementSettings, listAdvertisements, saveAdvertisementSettings, type Advertisement, type AdvertisementSettings } from '../../api/advertisements'
import { confirmAction } from '../../composables/confirm'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import AdminSection from './AdminSection.vue'
import AdminToggle from './AdminToggle.vue'
import AdvertisementEditModal from './AdvertisementEditModal.vue'
import AdvertisementUploadModal from './AdvertisementUploadModal.vue'

const { t } = useI18n()
const ads = ref<Advertisement[]>([])
const settings = ref<AdvertisementSettings | null>(null)
const enabledCount = computed(() => ads.value.filter((ad) => ad.enabled).length)
const loading = ref(true)
const busy = ref(false)
const input = 'mt-2 h-11 w-full rounded border border-flixer-border bg-flixer-background px-3 text-sm text-flixer-text focus-visible:outline-2 focus-visible:outline-flixer-accent'

async function load() {
  const [error, result] = await catchError(Promise.all([listAdvertisements(), getAdvertisementSettings()]))
  if (error) notify.error(describeRequestError(error, t('advertisements.loadError')))
  else [ads.value, settings.value] = result
  loading.value = false
}
onMounted(load)

async function saveSettings() {
  if (!settings.value || busy.value) return
  busy.value = true
  const [error, result] = await catchError(saveAdvertisementSettings(settings.value))
  if (error) notify.error(describeRequestError(error, t('advertisements.saveError')))
  else { settings.value = result; notify.success(t('advertisements.saved')) }
  busy.value = false
}

async function choose(ad: Advertisement) {
  const [error, saved] = await catchError(openModal<Advertisement>(AdvertisementEditModal, { props: { ad } }))
  if (!error && saved) ads.value = ads.value.map((entry) => entry.id === saved.id ? saved : entry)
}

async function upload() {
  const [error, ad] = await catchError(openModal<Advertisement>(AdvertisementUploadModal))
  if (!error && ad) {
    ads.value.unshift(ad)
    void choose(ad)
  }
}

async function remove(ad: Advertisement) {
  if (busy.value || !(await confirmAction(t('advertisements.confirmDelete', { name: ad.name }), { danger: true }))) return
  busy.value = true
  const [error] = await catchError(deleteAdvertisement(ad.id))
  if (error) notify.error(describeRequestError(error, t('advertisements.deleteError')))
  else {
    ads.value = ads.value.filter((entry) => entry.id !== ad.id)
  }
  busy.value = false
}
</script>

<template>
  <div class="space-y-5">
    <div v-if="!loading && settings" class="grid gap-3 sm:grid-cols-3">
      <div class="admin-card p-4"><p class="text-sm text-flixer-muted">{{ t('advertisements.status') }}</p><p class="mt-2 font-semibold">{{ settings.enabled ? t('advertisements.active') : t('advertisements.inactive') }}</p></div>
      <div class="admin-card p-4"><p class="text-sm text-flixer-muted">{{ t('advertisements.catalog') }}</p><p class="mt-2 text-xl font-semibold">{{ ads.length }}</p></div>
      <div class="admin-card p-4"><p class="text-sm text-flixer-muted">{{ t('analytics.enabledAds') }}</p><p class="mt-2 text-xl font-semibold">{{ enabledCount }}</p></div>
    </div>
    <AdminSection :title="t('advertisements.title')" :description="t('advertisements.description')">
      <p v-if="loading" role="status" class="text-sm text-flixer-muted">{{ t('payments.loading') }}</p>
      <form v-else-if="settings" class="space-y-4" @submit.prevent="saveSettings">
        <AdminToggle v-model="settings.enabled" :label="t('advertisements.enabled')" :description="t('advertisements.enabledHint')" />
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="text-sm">{{ t('advertisements.minimumInterval') }}<input v-model.number="settings.minimumIntervalSeconds" :class="input" type="number" min="0" max="86400" required /></label>
          <label class="text-sm">{{ t('advertisements.maxPerPlayback') }}<input v-model.number="settings.maxPerPlayback" :class="input" type="number" min="0" max="100" required /></label>
        </div>
        <button type="submit" :disabled="busy" class="h-11 rounded bg-flixer-primary px-6 text-sm font-semibold text-white disabled:opacity-50">{{ t('common.save') }}</button>
      </form>
    </AdminSection>
    <AdminSection :title="t('advertisements.catalog')" :description="t('advertisements.catalogHint')">
      <template #actions><button type="button" class="h-11 rounded bg-flixer-primary px-5 text-sm font-semibold text-white hover:brightness-110" @click="upload">{{ t('advertisements.upload') }}</button></template>
      <p v-if="!ads.length" class="text-sm text-flixer-muted">{{ t('advertisements.empty') }}</p>
      <ul v-else class="grid gap-2">
        <li v-for="ad in ads" :key="ad.id" class="flex flex-wrap items-center justify-between gap-3 rounded border border-flixer-border bg-flixer-background/50 p-4">
          <div><p class="font-semibold">{{ ad.name }}</p><p class="mt-1 text-xs text-flixer-muted">{{ ad.enabled ? t('advertisements.active') : t('advertisements.inactive') }} · {{ Math.ceil(ad.durationSeconds) }}s</p></div>
          <div class="flex gap-2">
            <button type="button" class="rounded border border-flixer-border px-4 py-2 text-sm hover:bg-white/5" @click="choose(ad)">{{ t('payments.admin.edit') }}</button>
            <button type="button" :disabled="busy" class="rounded bg-red-500/15 px-4 py-2 text-sm text-red-200 disabled:opacity-50" @click="remove(ad)">{{ t('common.delete') }}</button>
          </div>
        </li>
      </ul>
    </AdminSection>
  </div>
</template>
