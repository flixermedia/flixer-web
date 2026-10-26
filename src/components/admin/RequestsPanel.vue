<script setup lang="ts">
import { openModal } from '@kolirt/vue-modal'
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { deleteRequestService, getRequestsConfig, listMediaLibraries, listRequestServices, listRequestUsers, listSettings, updateRequestUser, updateSetting, type MediaLibrary, type RequestServiceView, type RequestUserView } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import AdminSection from './AdminSection.vue'
import AdminToggle from './AdminToggle.vue'
import ConfirmModal from '../ui/ConfirmModal.vue'
import RequestServiceModal from './RequestServiceModal.vue'

const { t } = useI18n()
const config = ref<Awaited<ReturnType<typeof getRequestsConfig>> | null>(null)
const settings = ref<Record<string, unknown>>({})
const services = ref<RequestServiceView[]>([])
const libraries = ref<MediaLibrary[]>([])
const users = ref<RequestUserView[]>([])
const overrides: Record<string, RequestUserView> = reactive({})
const inputClass = 'mt-1 w-full rounded-lg border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-flixer-text'
async function load() {
  try {
    const [settingList, serviceList, userList, requestConfig, libraryList] = await Promise.all([listSettings(), listRequestServices(), listRequestUsers(), getRequestsConfig(), listMediaLibraries()])
    settings.value = Object.fromEntries(settingList.map(({ key, value }) => [key, value]))
    services.value = serviceList
    libraries.value = libraryList
    users.value = userList
    config.value = requestConfig
    for (const user of userList) overrides[user.id] = { ...user }
  } catch (error) {
    notify.error(describeRequestError(error, t('admin.requests.loadError')))
  }
}
async function saveGlobal(key: string, value: unknown) {
  try {
    await updateSetting(key, value)
    settings.value[key] = value
    notify.success(t('admin.requests.saved'))
  } catch (error) {
    notify.error(describeRequestError(error, t('admin.requests.saveError')))
  }
}
async function openEditor(service?: RequestServiceView) {
  const saved = await openModal<boolean>(RequestServiceModal, { props: { service, libraries: libraries.value } }).catch(() => false)
  if (saved) await load()
}
async function removeService(id: string) {
  const confirmed = await openModal<boolean>(ConfirmModal, { props: { message: t('admin.requests.confirmDeleteService'), confirmLabel: t('admin.requests.removeService'), danger: true } }).catch(() => false)
  if (!confirmed) return
  try {
    await deleteRequestService(id)
    await load()
  } catch (error) {
    notify.error(describeRequestError(error))
  }
}
function setUserNumber(id: string, field: 'quotaLimit' | 'quotaDays', value: string) {
  overrides[id][field] = value === '' ? null : Number(value)
}
async function saveUser(id: string) {
  try {
    await updateRequestUser(id, { canRequest: overrides[id].canRequest, autoApprove: overrides[id].autoApprove, quotaLimit: overrides[id].quotaLimit, quotaDays: overrides[id].quotaDays })
    notify.success(t('admin.requests.saved'))
  } catch (error) {
    notify.error(describeRequestError(error))
  }
}
onMounted(load)
</script>

<template>
  <div class="flex flex-col gap-6">
    <AdminSection :title="t('admin.requests.generalTitle')" :description="t('admin.requests.generalDescription')">
      <div class="flex flex-col gap-3">
        <p v-if="config && !config.tmdbConfigured" class="rounded-lg border border-amber-300/20 bg-amber-300/[0.06] p-3 text-xs leading-5 text-amber-200">{{ t('admin.requests.tmdbWarning') }}</p>
        <p v-if="config && !config.discogsConfigured" class="rounded-lg border border-amber-300/20 bg-amber-300/[0.06] p-3 text-xs leading-5 text-amber-200">{{ t('admin.requests.discogsWarning') }}</p>
        <div class="grid gap-x-10 divide-y divide-flixer-border lg:grid-cols-2 lg:divide-y-0">
          <div class="divide-y divide-flixer-border">
            <AdminToggle :model-value="Boolean(settings.requests_enabled)" :label="t('admin.requests.enabled')" :description="t('admin.requests.enabledHint')" @update:model-value="saveGlobal('requests_enabled', $event)" />
            <AdminToggle :model-value="settings.requests_movies_enabled !== false" :label="t('admin.requests.requests_movies_enabled')" @update:model-value="saveGlobal('requests_movies_enabled', $event)" />
            <AdminToggle :model-value="settings.requests_tv_enabled !== false" :label="t('admin.requests.requests_tv_enabled')" @update:model-value="saveGlobal('requests_tv_enabled', $event)" />
            <AdminToggle :model-value="settings.requests_music_enabled !== false" :label="t('admin.requests.requests_music_enabled')" @update:model-value="saveGlobal('requests_music_enabled', $event)" />
          </div>
          <div class="divide-y divide-flixer-border">
            <AdminToggle :model-value="Boolean(settings.requests_auto_approve)" :label="t('admin.requests.autoApprove')" @update:model-value="saveGlobal('requests_auto_approve', $event)" />
            <AdminToggle :model-value="settings.requests_default_can_request !== false" :label="t('admin.requests.defaultCanRequest')" @update:model-value="saveGlobal('requests_default_can_request', $event)" />
            <AdminToggle :model-value="Boolean(settings.requests_notify_admins)" :label="t('admin.requests.notifyAdmins')" @update:model-value="saveGlobal('requests_notify_admins', $event)" />
            <AdminToggle :model-value="Boolean(settings.requests_notify_users)" :label="t('admin.requests.notifyUsers')" @update:model-value="saveGlobal('requests_notify_users', $event)" />
          </div>
        </div>
        <div class="border-t border-flixer-border pt-4">
          <h3 class="text-sm font-medium">{{ t('admin.requests.quotaTitle') }}</h3>
          <div class="mt-2 grid max-w-md gap-3 sm:grid-cols-2">
            <label class="text-xs font-medium text-flixer-muted">{{ t('admin.requests.quotaLimit') }}<input :value="settings.requests_quota_limit ?? 0" type="number" min="0" :class="inputClass" @change="saveGlobal('requests_quota_limit', Number(($event.target as HTMLInputElement).value))" /></label>
            <label class="text-xs font-medium text-flixer-muted">{{ t('admin.requests.quotaDays') }}<input :value="settings.requests_quota_days ?? 7" type="number" min="1" max="365" :class="inputClass" @change="saveGlobal('requests_quota_days', Number(($event.target as HTMLInputElement).value))" /></label>
          </div>
          <p class="mt-2 text-xs text-flixer-muted">{{ t('admin.requests.quotaHint') }}</p>
        </div>
      </div>
    </AdminSection>

    <AdminSection :title="t('admin.requests.servicesTitle')" :description="t('admin.requests.servicesDescription')">
      <template #actions
        ><button type="button" class="inline-flex items-center gap-2 rounded-lg bg-flixer-primary px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-flixer-primary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" @click="openEditor()"><span aria-hidden="true">＋</span>{{ t('admin.requests.addService') }}</button></template
      >
      <ul v-if="services.length" class="grid gap-3 md:grid-cols-2">
        <li v-for="service in services" :key="service.id" class="rounded-xl border border-flixer-border bg-flixer-background/40 p-4 transition hover:border-white/20">
          <div class="flex items-start gap-3">
            <span class="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-sm font-bold text-flixer-accent" :aria-label="service.kind">{{ service.kind === 'sonarr' ? 'S' : service.kind === 'radarr' ? 'R' : 'L' }}</span>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="truncate text-sm font-semibold text-white">{{ service.name }}</h3>
                <span class="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-flixer-muted">{{ service.kind }}</span
                ><span v-if="service.isDefault" class="rounded-full border border-flixer-accent/25 bg-flixer-accent/10 px-2 py-0.5 text-[10px] font-semibold text-flixer-accent">{{ t('admin.requests.defaultService') }}</span
                ><span class="rounded-full border px-2 py-0.5 text-[10px] font-semibold" :class="service.enabled ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200' : 'border-white/10 bg-white/[0.04] text-flixer-muted'">{{ service.enabled ? t('admin.requests.serviceEnabled') : t('admin.requests.serviceDisabled') }}</span>
              </div>
              <p class="mt-1 truncate text-xs text-flixer-muted">{{ service.url }}</p>
              <div class="mt-2 flex flex-wrap items-center gap-2">
                <span v-if="service.libraryId" class="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] text-flixer-muted">{{ t('admin.requests.library') }}: {{ service.libraryName || libraries.find((library) => library.id === service.libraryId)?.name }}</span
                ><span v-else class="rounded-full border border-amber-300/25 bg-amber-300/10 px-2 py-1 text-[10px] font-semibold text-amber-100">{{ t('admin.requests.notLinkedLibrary') }}</span
                ><span class="text-[11px] text-flixer-muted">{{ t('admin.requests.rootFolder') }}: {{ service.rootFolder }}</span>
              </div>
            </div>
          </div>
          <div class="mt-4 flex justify-end gap-2 border-t border-flixer-border pt-3">
            <button type="button" class="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" @click="openEditor(service)">{{ t('admin.requests.editService') }}</button><button type="button" class="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-400/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" @click="removeService(service.id)">{{ t('admin.requests.removeService') }}</button>
          </div>
        </li>
      </ul>
      <p v-else class="rounded-xl border border-dashed border-flixer-border px-4 py-8 text-center text-sm text-flixer-muted">{{ t('admin.requests.noServices') }}</p>
    </AdminSection>

    <AdminSection :title="t('admin.requests.usersTitle')" :description="t('admin.requests.usersDescription')">
      <div v-if="users.length" class="overflow-hidden rounded-xl border border-flixer-border">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[46rem] border-collapse text-left text-xs">
            <thead class="bg-flixer-background/60 text-[10px] uppercase tracking-wide text-flixer-muted">
              <tr>
                <th scope="col" class="px-3 py-3">{{ t('admin.requests.user') }}</th>
                <th scope="col" class="px-3 py-3">{{ t('admin.requests.canRequest') }}</th>
                <th scope="col" class="px-3 py-3">{{ t('admin.requests.autoApprove') }}</th>
                <th scope="col" class="px-3 py-3">{{ t('admin.requests.quotaLimit') }}</th>
                <th scope="col" class="px-3 py-3">{{ t('admin.requests.quotaDays') }}</th>
                <th scope="col" class="px-3 py-3">
                  <span class="sr-only">{{ t('common.save') }}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id" class="border-t border-flixer-border transition hover:bg-white/[0.025]">
                <th scope="row" class="px-3 py-2.5 font-medium text-white">
                  <span class="block max-w-44 truncate">{{ user.displayName || user.username }}</span
                  ><span class="mt-0.5 block font-normal text-flixer-muted">{{ user.username }}</span>
                </th>
                <td class="px-2 py-2">
                  <select v-model="overrides[user.id].canRequest" :aria-label="`${t('admin.requests.canRequest')}: ${user.username}`" :class="inputClass">
                    <option :value="null">{{ t('admin.requests.inherit') }}</option>
                    <option :value="true">{{ t('admin.requests.allow') }}</option>
                    <option :value="false">{{ t('admin.requests.deny') }}</option>
                  </select>
                </td>
                <td class="px-2 py-2">
                  <select v-model="overrides[user.id].autoApprove" :aria-label="`${t('admin.requests.autoApprove')}: ${user.username}`" :class="inputClass">
                    <option :value="null">{{ t('admin.requests.inherit') }}</option>
                    <option :value="true">{{ t('admin.requests.allow') }}</option>
                    <option :value="false">{{ t('admin.requests.deny') }}</option>
                  </select>
                </td>
                <td class="px-2 py-2"><input :value="overrides[user.id].quotaLimit ?? ''" :aria-label="`${t('admin.requests.quotaLimit')}: ${user.username}`" type="number" min="0" :class="inputClass" @change="setUserNumber(user.id, 'quotaLimit', ($event.target as HTMLInputElement).value)" /></td>
                <td class="px-2 py-2"><input :value="overrides[user.id].quotaDays ?? ''" :aria-label="`${t('admin.requests.quotaDays')}: ${user.username}`" type="number" min="1" max="365" :class="inputClass" @change="setUserNumber(user.id, 'quotaDays', ($event.target as HTMLInputElement).value)" /></td>
                <td class="px-2 py-2">
                  <button type="button" class="rounded-lg bg-white/[0.08] px-3 py-2 font-semibold text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" :aria-label="`${t('common.save')}: ${user.username}`" @click="saveUser(user.id)">{{ t('common.save') }}</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <p v-else class="rounded-xl border border-dashed border-flixer-border px-4 py-8 text-center text-sm text-flixer-muted">{{ t('admin.requests.noUsers') }}</p>
    </AdminSection>
  </div>
</template>
