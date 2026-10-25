<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { deleteRequestService, getRequestsConfig, listMediaLibraries, listRequestServices, listRequestUsers, listSettings, saveRequestService, testRequestService, updateRequestUser, updateSetting, type MediaLibrary, type RequestServiceInput, type RequestServiceTest, type RequestServiceView, type RequestUserView } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import AdminSection from './AdminSection.vue'
import AdminToggle from './AdminToggle.vue'
import { RouterLink } from 'vue-router'

const { t } = useI18n()
const config = ref<Awaited<ReturnType<typeof getRequestsConfig>> | null>(null)
const settings = ref<Record<string, unknown>>({})
const services = ref<RequestServiceView[]>([])
const libraries = ref<MediaLibrary[]>([])
const compatibleLibraries = computed(() => {
  const allowed = draft.kind === 'radarr' ? ['movies', 'mixed'] : draft.kind === 'sonarr' ? ['tvshows', 'mixed'] : ['music', 'mixed']
  return libraries.value.filter((library) => allowed.includes(library.type))
})
const users = ref<RequestUserView[]>([])
const editor = ref(false)
const editingId = ref<string | undefined>()
const testing = ref(false)
const testResult = ref<RequestServiceTest | null>(null)
const draft = reactive<RequestServiceInput>({ kind: 'sonarr', libraryId: '', name: '', url: '', enabled: true, isDefault: false, rootFolder: '', qualityProfileId: 0, metadataProfileId: null, languageProfileId: null, minimumAvailability: null, seasonFolders: true, tags: [], apiKey: '' })
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
function compatibleLibraryId(kind: RequestServiceInput['kind']) {
  const allowed = kind === 'radarr' ? ['movies', 'mixed'] : kind === 'sonarr' ? ['tvshows', 'mixed'] : ['music', 'mixed']
  const compatible = libraries.value.filter((library) => allowed.includes(library.type))
  return compatible.length === 1 ? compatible[0].id : ''
}
function changeServiceKind(kind: RequestServiceInput['kind']) {
  draft.kind = kind
  draft.libraryId = compatibleLibraryId(kind)
}
function openEditor(service?: RequestServiceView) {
  editingId.value = service?.id
  const { id: _id, hasKey: _hasKey, ...serviceInput } = service ?? { id: '', hasKey: false, ...draft }
  Object.assign(draft, service ? { ...serviceInput, libraryId: service.libraryId ?? '', apiKey: '********' } : { kind: 'sonarr', libraryId: compatibleLibraryId('sonarr'), name: '', url: '', enabled: true, isDefault: false, rootFolder: '', qualityProfileId: 0, metadataProfileId: null, languageProfileId: null, minimumAvailability: null, seasonFolders: true, tags: [], apiKey: '' })
  testResult.value = null
  editor.value = true
}
async function test() {
  testing.value = true
  try {
    testResult.value = await testRequestService({ kind: draft.kind, url: draft.url, apiKey: draft.apiKey ?? '', serviceId: editingId.value })
    if (testResult.value.qualityProfiles.length && !testResult.value.qualityProfiles.some(({ id }) => id === draft.qualityProfileId)) draft.qualityProfileId = testResult.value.qualityProfiles[0].id
    if (testResult.value.rootFolders.length && !testResult.value.rootFolders.some(({ path }) => path === draft.rootFolder)) draft.rootFolder = testResult.value.rootFolders[0].path
    if (!testResult.value.ok) notify.error(testResult.value.error || t('admin.requests.testFailed'))
  } catch (error) {
    notify.error(describeRequestError(error, t('admin.requests.testFailed')))
  } finally {
    testing.value = false
  }
}
async function saveService() {
  if (!draft.libraryId || !compatibleLibraries.value.some((library) => library.id === draft.libraryId)) return
  try {
    await saveRequestService({ ...draft, apiKey: draft.apiKey || undefined }, editingId.value)
    editor.value = false
    await load()
  } catch (error) {
    notify.error(describeRequestError(error, t('admin.requests.saveError')))
  }
}
async function removeService(id: string) {
  if (!window.confirm(t('admin.requests.confirmDeleteService'))) return
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
      <div class="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div class="rounded-xl border border-flixer-border bg-flixer-background/40 p-3 sm:p-4">
          <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-flixer-muted">{{ t('admin.requests.enabled') }}</h3>
          <AdminToggle :model-value="Boolean(settings.requests_enabled)" :label="t('admin.requests.enabled')" :description="t('admin.requests.enabledHint')" @update:model-value="saveGlobal('requests_enabled', $event)" />
          <div v-if="!config?.tmdbConfigured || !config?.discogsConfigured" class="mt-3 space-y-2">
            <p v-if="!config?.tmdbConfigured" class="flex gap-2 rounded-lg border border-amber-300/20 bg-amber-300/[0.06] p-3 text-xs leading-5 text-amber-200"><span aria-hidden="true">!</span>{{ t('admin.requests.tmdbWarning') }}</p>
            <p v-if="!config?.discogsConfigured" class="flex gap-2 rounded-lg border border-amber-300/20 bg-amber-300/[0.06] p-3 text-xs leading-5 text-amber-200"><span aria-hidden="true">!</span>{{ t('admin.requests.discogsWarning') }}</p>
          </div>
        </div>
        <div class="rounded-xl border border-flixer-border bg-flixer-background/40 p-3 sm:p-4">
          <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-flixer-muted">{{ t('admin.requests.mediaTypes') }}</h3>
          <div class="grid gap-x-8 sm:grid-cols-2"><AdminToggle :model-value="settings.requests_movies_enabled !== false" :label="t('admin.requests.requests_movies_enabled')" @update:model-value="saveGlobal('requests_movies_enabled', $event)" /><AdminToggle :model-value="settings.requests_tv_enabled !== false" :label="t('admin.requests.requests_tv_enabled')" @update:model-value="saveGlobal('requests_tv_enabled', $event)" /><AdminToggle :model-value="settings.requests_music_enabled !== false" :label="t('admin.requests.requests_music_enabled')" @update:model-value="saveGlobal('requests_music_enabled', $event)" /><AdminToggle :model-value="Boolean(settings.requests_auto_approve)" :label="t('admin.requests.autoApprove')" @update:model-value="saveGlobal('requests_auto_approve', $event)" /></div>
        </div>
        <div class="rounded-xl border border-flixer-border bg-flixer-background/40 p-3 sm:p-4">
          <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-flixer-muted">{{ t('admin.requests.quotaTitle') }}</h3>
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="text-xs font-medium text-flixer-muted">{{ t('admin.requests.quotaLimit') }}<input :value="settings.requests_quota_limit ?? 0" type="number" min="0" :class="inputClass" @change="saveGlobal('requests_quota_limit', Number(($event.target as HTMLInputElement).value))" /></label><label class="text-xs font-medium text-flixer-muted">{{ t('admin.requests.quotaDays') }}<input :value="settings.requests_quota_days ?? 30" type="number" min="1" max="365" :class="inputClass" @change="saveGlobal('requests_quota_days', Number(($event.target as HTMLInputElement).value))" /></label>
          </div>
          <p class="mt-2 text-[11px] text-flixer-muted">{{ t('admin.requests.quotaHint') }}</p>
        </div>
        <div class="rounded-xl border border-flixer-border bg-flixer-background/40 p-3 sm:p-4">
          <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-flixer-muted">{{ t('admin.requests.accessNotifications') }}</h3>
          <div class="grid gap-x-8 sm:grid-cols-2"><AdminToggle :model-value="settings.requests_default_can_request !== false" :label="t('admin.requests.defaultCanRequest')" @update:model-value="saveGlobal('requests_default_can_request', $event)" /><AdminToggle :model-value="Boolean(settings.requests_notify_admins)" :label="t('admin.requests.notifyAdmins')" @update:model-value="saveGlobal('requests_notify_admins', $event)" /><AdminToggle :model-value="Boolean(settings.requests_notify_users)" :label="t('admin.requests.notifyUsers')" @update:model-value="saveGlobal('requests_notify_users', $event)" /></div>
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

    <div v-if="editor" class="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="request-service-title" @click.self="editor = false">
      <div class="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-white/10 bg-flixer-surface p-4 shadow-2xl shadow-black/50 sm:rounded-2xl sm:p-6">
        <div class="flex items-start justify-between gap-4 border-b border-flixer-border pb-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-flixer-accent">{{ t('admin.requests.serviceKind') }}</p>
            <h2 id="request-service-title" class="mt-1 text-xl font-semibold text-white">{{ editingId ? t('admin.requests.editService') : t('admin.requests.addService') }}</h2>
          </div>
          <button type="button" class="grid size-9 place-items-center rounded-lg text-flixer-muted transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" :aria-label="t('common.close')" @click="editor = false">×</button>
        </div>
        <div class="mt-5 grid gap-4 sm:grid-cols-2">
          <label v-for="field in ['name', 'url'] as const" :key="field" class="text-xs font-medium text-flixer-muted">{{ t(`admin.requests.${field}`) }}<input v-model="draft[field]" :type="field === 'url' ? 'url' : 'text'" :class="inputClass" /></label
          ><label class="text-xs font-medium text-flixer-muted"
            >{{ t('admin.requests.serviceKind')
            }}<select :value="draft.kind" :class="inputClass" @change="changeServiceKind(($event.target as HTMLSelectElement).value as RequestServiceInput['kind'])">
              <option value="sonarr">Sonarr</option>
              <option value="radarr">Radarr</option>
              <option value="lidarr">Lidarr</option>
            </select></label
          ><label class="text-xs font-medium text-flixer-muted"
            >{{ t('admin.requests.library')
            }}<select :value="draft.libraryId" required :disabled="compatibleLibraries.length === 0" :class="inputClass" @change="draft.libraryId = ($event.target as HTMLSelectElement).value">
              <option value="" disabled>{{ t('admin.requests.selectLibrary') }}</option>
              <option v-for="library in compatibleLibraries" :key="library.id" :value="library.id">
                {{ library.name }}<template v-if="library.type === 'mixed'"> · {{ t('admin.requests.mixedLibrary') }}</template>
              </option></select
            ><span class="mt-1 block text-[11px] text-flixer-muted">{{ t('admin.requests.libraryHint') }}</span
            ><span v-if="compatibleLibraries.length === 0" class="mt-2 block rounded-lg border border-amber-300/20 bg-amber-300/[0.06] p-2.5 text-xs leading-5 text-amber-200"
              >{{ t('admin.requests.noCompatibleLibrary') }} <RouterLink :to="{ name: 'admin', query: { tab: 'library' } }" class="font-semibold underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent">{{ t('admin.requests.goToLibraries') }}</RouterLink></span
            ></label
          ><label class="text-xs font-medium text-flixer-muted">{{ t('admin.requests.apiKey') }}<input v-model="draft.apiKey" type="password" autocomplete="new-password" :placeholder="editingId ? '••••••••' : ''" :class="inputClass" /></label
          ><label class="text-xs font-medium text-flixer-muted"
            >{{ t('admin.requests.qualityProfile')
            }}<select v-model.number="draft.qualityProfileId" :class="inputClass">
              <option v-for="entry in testResult?.qualityProfiles ?? []" :key="entry.id" :value="entry.id">{{ entry.name }}</option>
            </select></label
          ><label class="text-xs font-medium text-flixer-muted"
            >{{ t('admin.requests.rootFolder')
            }}<select v-if="testResult?.rootFolders.length" v-model="draft.rootFolder" :class="inputClass">
              <option v-for="entry in testResult.rootFolders" :key="entry.path" :value="entry.path">{{ entry.path }}</option></select
            ><input v-else v-model="draft.rootFolder" :class="inputClass" /></label
          ><label v-if="draft.kind === 'lidarr'" class="text-xs font-medium text-flixer-muted"
            >{{ t('admin.requests.metadataProfile')
            }}<select v-model.number="draft.metadataProfileId" :class="inputClass">
              <option v-for="entry in testResult?.metadataProfiles ?? []" :key="entry.id" :value="entry.id">{{ entry.name }}</option>
            </select></label
          ><label v-if="draft.kind === 'sonarr' && testResult?.languageProfiles.length" class="text-xs font-medium text-flixer-muted"
            >{{ t('admin.requests.languageProfile')
            }}<select v-model.number="draft.languageProfileId" :class="inputClass">
              <option v-for="entry in testResult.languageProfiles" :key="entry.id" :value="entry.id">{{ entry.name }}</option>
            </select></label
          ><label v-if="draft.kind === 'radarr'" class="text-xs font-medium text-flixer-muted"
            >{{ t('admin.requests.minimumAvailability')
            }}<select v-model="draft.minimumAvailability" :class="inputClass">
              <option value="announced">announced</option>
              <option value="inCinemas">inCinemas</option>
              <option value="released">released</option>
            </select></label
          ><label v-if="draft.kind === 'sonarr'" class="flex items-center gap-2 self-end rounded-lg border border-flixer-border px-3 py-2.5 text-sm text-white"><input v-model="draft.seasonFolders" type="checkbox" class="size-4 accent-flixer-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" />{{ t('admin.requests.seasonFolders') }}</label
          ><label class="flex items-center gap-2 self-end rounded-lg border border-flixer-border px-3 py-2.5 text-sm text-white"><input v-model="draft.isDefault" type="checkbox" class="size-4 accent-flixer-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" />{{ t('admin.requests.defaultService') }}</label
          ><label class="flex items-center gap-2 self-end rounded-lg border border-flixer-border px-3 py-2.5 text-sm text-white"><input v-model="draft.enabled" type="checkbox" class="size-4 accent-flixer-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" />{{ t('admin.requests.serviceEnabled') }}</label>
        </div>
        <p v-if="testResult?.version" class="mt-4 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.06] p-3 text-xs text-emerald-200">{{ t('admin.requests.connectionOk', { version: testResult.version }) }}</p>
        <div class="sticky bottom-0 mt-6 flex flex-col-reverse gap-2 border-t border-flixer-border bg-flixer-surface pt-4 sm:flex-row sm:justify-end">
          <button type="button" class="rounded-lg border border-flixer-border px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" @click="editor = false">{{ t('common.cancel') }}</button><button type="button" class="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent disabled:opacity-50" :disabled="testing" @click="test">{{ testing ? t('common.loading') : t('admin.requests.testConnection') }}</button
          ><button type="button" class="rounded-lg bg-flixer-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-flixer-primary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent disabled:cursor-not-allowed disabled:opacity-50" :disabled="!draft.libraryId || !compatibleLibraries.some((library) => library.id === draft.libraryId)" @click="saveService">{{ t('common.save') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
