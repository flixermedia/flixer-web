<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { saveRequestService, testRequestService, type MediaLibrary, type RequestServiceInput, type RequestServiceTest, type RequestServiceView } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import TextInput from '../ui/TextInput.vue'
import AdminToggle from './AdminToggle.vue'

defineOptions({ modalGroup: 'default' })

const props = defineProps<{ service?: RequestServiceView; libraries: MediaLibrary[] }>()
const { close, confirm } = useModalContext<boolean>()
const { t } = useI18n()

const kindTypes = { radarr: ['movies', 'mixed'], sonarr: ['tvshows', 'mixed'], lidarr: ['music', 'mixed'] } as const
function compatibleFor(kind: RequestServiceInput['kind']) {
  return props.libraries.filter((library) => (kindTypes[kind] as readonly string[]).includes(library.type))
}

const selectClass = 'mt-1.5 w-full rounded-lg border border-flixer-border bg-flixer-background px-4 py-3 text-sm text-flixer-text focus-visible:outline-2 focus-visible:outline-flixer-accent'
const labelClass = 'block text-xs font-medium text-flixer-muted'

const editingId = props.service?.id
const draft = reactive<RequestServiceInput>(
  props.service
    ? (() => {
        const { id: _id, hasKey: _hasKey, ...input } = props.service
        return { ...input, libraryId: props.service.libraryId ?? '', apiKey: '' }
      })()
    : { kind: 'sonarr', libraryId: compatibleFor('sonarr').length === 1 ? compatibleFor('sonarr')[0].id : '', name: '', url: '', enabled: true, isDefault: false, rootFolder: '', qualityProfileId: 0, metadataProfileId: null, languageProfileId: null, minimumAvailability: null, seasonFolders: true, tags: [], apiKey: '' },
)
const testResult = ref<RequestServiceTest | null>(null)
const testing = ref(false)
const saving = ref(false)
const compatibleLibraries = computed(() => compatibleFor(draft.kind))
const canSave = computed(() => Boolean(draft.name && draft.url && draft.libraryId && compatibleLibraries.value.some((library) => library.id === draft.libraryId)))

function changeKind(kind: RequestServiceInput['kind']) {
  draft.kind = kind
  const compatible = compatibleFor(kind)
  draft.libraryId = compatible.length === 1 ? compatible[0].id : ''
  testResult.value = null
}

async function test() {
  testing.value = true
  try {
    const result = await testRequestService({ kind: draft.kind, url: draft.url, apiKey: draft.apiKey ?? '', serviceId: editingId })
    testResult.value = result
    if (result.qualityProfiles.length && !result.qualityProfiles.some(({ id }) => id === draft.qualityProfileId)) draft.qualityProfileId = result.qualityProfiles[0].id
    if (result.rootFolders.length && !result.rootFolders.some(({ path }) => path === draft.rootFolder)) draft.rootFolder = result.rootFolders[0].path
    if (!result.ok) notify.error(result.error || t('admin.requests.testFailed'))
  } catch (error) {
    notify.error(describeRequestError(error, t('admin.requests.testFailed')))
  } finally {
    testing.value = false
  }
}

async function save() {
  if (!canSave.value) return
  saving.value = true
  try {
    await saveRequestService({ ...draft, apiKey: draft.apiKey || undefined }, editingId)
    confirm(true)
  } catch (error) {
    notify.error(describeRequestError(error, t('admin.requests.saveError')))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col rounded-2xl border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <ModalTitle class="shrink-0 text-lg font-semibold">{{ editingId ? t('admin.requests.editService') : t('admin.requests.addService') }}</ModalTitle>
      <ModalDescription class="mt-1 shrink-0 text-sm leading-6 text-flixer-muted">{{ t('admin.requests.servicesDescription') }}</ModalDescription>

      <form class="-mx-1 mt-5 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-1 overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" @submit.prevent="save">
        <div class="grid gap-4 sm:grid-cols-2">
          <label :class="labelClass"
            >{{ t('admin.requests.serviceKind') }}
            <select :value="draft.kind" :class="selectClass" @change="changeKind(($event.target as HTMLSelectElement).value as RequestServiceInput['kind'])">
              <option value="sonarr">Sonarr</option>
              <option value="radarr">Radarr</option>
              <option value="lidarr">Lidarr</option>
            </select>
          </label>
          <TextInput v-model="draft.name" :label="t('admin.requests.name')" name="serviceName" required maxlength="100" autocomplete="off" />
          <TextInput v-model="draft.url" :label="t('admin.requests.url')" type="url" name="serviceUrl" required autocomplete="off" />
          <TextInput v-model="draft.apiKey" :label="t('admin.requests.apiKey')" type="password" name="serviceApiKey" :placeholder="editingId ? '••••••••' : ''" autocomplete="new-password" />
        </div>

        <label :class="labelClass"
          >{{ t('admin.requests.library') }}
          <select v-model="draft.libraryId" required :disabled="compatibleLibraries.length === 0" :class="selectClass">
            <option value="" disabled>{{ t('admin.requests.selectLibrary') }}</option>
            <option v-for="library in compatibleLibraries" :key="library.id" :value="library.id">
              {{ library.name }}<template v-if="library.type === 'mixed'"> · {{ t('admin.requests.mixedLibrary') }}</template>
            </option>
          </select>
          <span class="mt-1.5 block text-[11px]">{{ t('admin.requests.libraryHint') }}</span>
          <span v-if="compatibleLibraries.length === 0" class="mt-2 block rounded-lg border border-amber-300/20 bg-amber-300/[0.06] p-2.5 text-xs leading-5 text-amber-200"
            >{{ t('admin.requests.noCompatibleLibrary') }}
            <RouterLink :to="{ name: 'admin', query: { tab: 'library' } }" class="font-semibold underline underline-offset-2" @click="close()">{{ t('admin.requests.goToLibraries') }}</RouterLink></span
          >
        </label>

        <div class="grid gap-4 sm:grid-cols-2">
          <label :class="labelClass"
            >{{ t('admin.requests.qualityProfile') }}
            <select v-model.number="draft.qualityProfileId" :class="selectClass">
              <option v-if="!testResult && draft.qualityProfileId" :value="draft.qualityProfileId">#{{ draft.qualityProfileId }}</option>
              <option v-for="entry in testResult?.qualityProfiles ?? []" :key="entry.id" :value="entry.id">{{ entry.name }}</option>
            </select>
          </label>
          <label :class="labelClass"
            >{{ t('admin.requests.rootFolder') }}
            <select v-if="testResult?.rootFolders.length" v-model="draft.rootFolder" :class="selectClass">
              <option v-for="entry in testResult.rootFolders" :key="entry.path" :value="entry.path">{{ entry.path }}</option>
            </select>
            <input v-else v-model="draft.rootFolder" :class="selectClass" />
          </label>
          <label v-if="draft.kind === 'lidarr'" :class="labelClass"
            >{{ t('admin.requests.metadataProfile') }}
            <select v-model.number="draft.metadataProfileId" :class="selectClass">
              <option v-for="entry in testResult?.metadataProfiles ?? []" :key="entry.id" :value="entry.id">{{ entry.name }}</option>
            </select>
          </label>
          <label v-if="draft.kind === 'sonarr' && testResult?.languageProfiles.length" :class="labelClass"
            >{{ t('admin.requests.languageProfile') }}
            <select v-model.number="draft.languageProfileId" :class="selectClass">
              <option v-for="entry in testResult.languageProfiles" :key="entry.id" :value="entry.id">{{ entry.name }}</option>
            </select>
          </label>
          <label v-if="draft.kind === 'radarr'" :class="labelClass"
            >{{ t('admin.requests.minimumAvailability') }}
            <select v-model="draft.minimumAvailability" :class="selectClass">
              <option value="announced">announced</option>
              <option value="inCinemas">inCinemas</option>
              <option value="released">released</option>
            </select>
          </label>
        </div>

        <div>
          <AdminToggle v-if="draft.kind === 'sonarr'" v-model="draft.seasonFolders" :label="t('admin.requests.seasonFolders')" />
          <AdminToggle v-model="draft.isDefault" :label="t('admin.requests.defaultService')" />
          <AdminToggle v-model="draft.enabled" :label="t('admin.requests.serviceEnabled')" />
        </div>

        <p v-if="testResult?.ok && testResult.version" class="rounded-lg border border-emerald-400/20 bg-emerald-400/[0.06] p-3 text-xs text-emerald-200">{{ t('admin.requests.connectionOk', { version: testResult.version }) }}</p>

        <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" class="flex h-11 items-center justify-center rounded-lg border border-flixer-border px-6 text-sm font-semibold text-flixer-text transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" :disabled="saving" @click="close()">{{ t('common.cancel') }}</button>
          <button type="button" class="flex h-11 items-center justify-center rounded-lg border border-flixer-border px-6 text-sm font-semibold text-flixer-text transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:opacity-60" :disabled="testing || !draft.url" @click="test">{{ testing ? t('common.loading') : t('admin.requests.testConnection') }}</button>
          <button type="submit" class="flex h-11 items-center justify-center rounded-lg bg-flixer-primary px-6 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:opacity-60" :disabled="saving || !canSave">{{ t('common.save') }}</button>
        </div>
      </form>
    </ModalContent>
  </ModalRoot>
</template>
