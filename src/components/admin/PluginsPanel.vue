<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { addPluginRepository, disablePlugin, discoverPlugins, enablePlugin, installPlugin as installPluginRequest, listPluginInstallations, listPluginRepositories, listPluginUpdateHistory, refreshPluginRepository, removePluginRepository, uninstallPlugin, type PluginCatalogEntry, type PluginInstallation, type PluginRepository, type PluginUpdateHistoryEntry } from '../../api'
import { confirmAction } from '../../composables/confirm'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import AdminSection from './AdminSection.vue'

const { t } = useI18n()
const router = useRouter()
const installations = ref<PluginInstallation[]>([])
const repositories = ref<PluginRepository[]>([])
const catalog = ref<PluginCatalogEntry[]>([])
const updateHistory = ref<Record<string, PluginUpdateHistoryEntry[]>>({})
const historyOpen = ref<string[]>([])
const historyLoading = ref<string | null>(null)
const name = ref('')
const url = ref('')
const query = ref('')
const target = ref('')
const capability = ref('')
const isLoading = ref(false)
const isSaving = ref(false)
const refreshing = ref<string | null>(null)
const installing = ref<string | null>(null)
const updating = ref<string | null>(null)
const loadError = ref('')

const inputClass = 'w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm outline-none focus:border-flixer-accent'
const buttonClass = 'rounded bg-flixer-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-60'
const quietButtonClass = 'rounded border border-flixer-border px-3 py-2 text-sm font-semibold transition hover:bg-white/5 disabled:opacity-60'

async function load() {
  isLoading.value = true
  loadError.value = ''
  try {
    ;[installations.value, repositories.value, catalog.value] = await Promise.all([listPluginInstallations(), listPluginRepositories(), discoverPlugins({ q: query.value || undefined, target: target.value || undefined, capability: capability.value || undefined })])
  } catch (error) {
    loadError.value = describeRequestError(error)
  } finally {
    isLoading.value = false
  }
}

async function refreshRepository(repository: PluginRepository) {
  refreshing.value = repository.id
  try {
    await refreshPluginRepository(repository.id)
  } catch (error) {
    notify.error(describeRequestError(error))
  } finally {
    refreshing.value = null
    await load()
  }
}

async function install(plugin: PluginCatalogEntry, version: string) {
  const repositoryId = plugin.repository?.id
  if (!repositoryId) return
  const permissions = plugin.permissions ?? []
  if (
    permissions.length &&
    !(await confirmAction(
      t('admin.plugins.confirmInstall', {
        name: plugin.name,
        version,
        permissions: permissions.join(', '),
      }),
    ))
  )
    return

  installing.value = `${plugin.id}:${version}`
  try {
    await installPluginRequest(plugin.id, { repositoryId, version, approvedPermissions: permissions })
    await load()
    notify.success(t('admin.plugins.installedSuccess', { name: plugin.name }))
  } catch (error) {
    notify.error(describeRequestError(error))
  } finally {
    installing.value = null
  }
}

async function updateInstalled(plugin: PluginInstallation) {
  const update = plugin.availableUpdate
  if (!update || !plugin.repository) return
  if (plugin.enabled) {
    notify.error(t('admin.plugins.disableBeforeUpdate'))
    return
  }
  const newlyRequested = update.permissions.filter((permission) => !plugin.approvedPermissions.includes(permission))
  if (
    !(await confirmAction(
      t('admin.plugins.confirmUpdate', {
        name: plugin.manifest.name,
        version: update.version,
        permissions: newlyRequested.length ? newlyRequested.join(', ') : t('admin.plugins.noNewPermissions'),
      }),
    ))
  )
    return

  updating.value = plugin.id
  try {
    await installPluginRequest(plugin.id, {
      repositoryId: plugin.repository.id,
      version: update.version,
      approvedPermissions: [...new Set([...plugin.approvedPermissions, ...update.permissions])],
    })
    await load()
    notify.success(t('admin.plugins.updatedSuccess', { name: plugin.manifest.name }))
  } catch (error) {
    notify.error(describeRequestError(error))
  } finally {
    updating.value = null
  }
}

async function setEnabled(plugin: PluginInstallation, enabled: boolean) {
  if (!enabled && !(await confirmAction(t('admin.plugins.confirmDisable', { name: plugin.manifest.name })))) return
  try {
    if (enabled) await enablePlugin(plugin.id)
    else await disablePlugin(plugin.id)
    await load()
  } catch (error) {
    notify.error(describeRequestError(error))
  }
}

async function uninstall(plugin: PluginInstallation) {
  if (!(await confirmAction(t('admin.plugins.confirmUninstall', { name: plugin.manifest.name }), { danger: true }))) return
  try {
    await uninstallPlugin(plugin.id)
    await load()
  } catch (error) {
    notify.error(describeRequestError(error))
  }
}

async function toggleHistory(plugin: PluginInstallation) {
  if (historyOpen.value.includes(plugin.id)) {
    historyOpen.value = historyOpen.value.filter((id) => id !== plugin.id)
    return
  }
  historyOpen.value = [...historyOpen.value, plugin.id]
  historyLoading.value = plugin.id
  try {
    updateHistory.value[plugin.id] = await listPluginUpdateHistory(plugin.id)
  } catch (error) {
    notify.error(describeRequestError(error))
    historyOpen.value = historyOpen.value.filter((id) => id !== plugin.id)
  } finally {
    historyLoading.value = null
  }
}

function openSettings(plugin: PluginInstallation) {
  void router.push({ query: { tab: 'plugins', plugin: plugin.id } })
}

async function addRepository() {
  isSaving.value = true
  try {
    await addPluginRepository(name.value, url.value)
    name.value = ''
    url.value = ''
    await load()
    notify.success(t('admin.plugins.repositoryAdded'))
  } catch (error) {
    notify.error(describeRequestError(error))
  } finally {
    isSaving.value = false
  }
}

async function removeRepository(repository: PluginRepository) {
  if (repository.isOfficial) return
  if (!(await confirmAction(t('admin.plugins.confirmRemove', { name: repository.name }), { danger: true }))) return

  try {
    await removePluginRepository(repository.id)
    await load()
  } catch (error) {
    notify.error(describeRequestError(error))
  }
}

onMounted(load)
</script>

<template>
  <div class="flex flex-col gap-6">
    <AdminSection :title="t('admin.plugins.installed')" :description="t('admin.plugins.installedDescription')">
      <div v-if="loadError" class="flex flex-wrap items-center justify-between gap-3 text-sm text-red-300" role="alert">
        <span>{{ loadError }}</span>
        <button :class="quietButtonClass" type="button" @click="load">{{ t('admin.plugins.retry') }}</button>
      </div>
      <p v-else-if="isLoading && installations.length === 0" class="text-sm text-flixer-muted" role="status">
        {{ t('admin.plugins.loading') }}
      </p>
      <p v-else-if="installations.length === 0" class="text-sm text-flixer-muted">
        {{ t('admin.plugins.noInstalled') }}
      </p>
      <ul v-else class="divide-y divide-flixer-border" aria-label="Installed plugins">
        <li v-for="plugin in installations" :key="plugin.id" class="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0 last:pb-0">
          <div class="min-w-0">
            <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <h3 class="font-semibold">{{ plugin.manifest.name }}</h3>
              <span class="text-xs text-flixer-muted">{{ plugin.id }} · {{ plugin.version }}</span>
            </div>
            <p class="mt-1 text-sm text-flixer-muted">{{ plugin.manifest.description }}</p>
            <p class="mt-1 text-xs text-flixer-muted">
              {{ t('admin.plugins.byAuthor', { author: plugin.manifest.author }) }}
              <span class="mx-1">·</span>
              {{ Object.keys(plugin.manifest.targets).join(', ') }}
              <span v-if="plugin.repository" class="mx-1">·</span>
              {{ plugin.repository?.name }}
            </p>
            <p v-if="plugin.activationReason" class="mt-2 text-xs text-flixer-muted">{{ plugin.activationReason }}</p>
            <p v-if="Object.keys(plugin.targetStatus).length" class="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-flixer-muted">
              <span v-for="(state, target) in plugin.targetStatus" :key="target">{{ t('admin.plugins.targetState', { target, state }) }}</span>
            </p>
            <p v-if="plugin.lastError" class="mt-2 text-sm text-red-300" role="status">{{ plugin.lastError }}</p>
          </div>
          <div class="flex shrink-0 flex-wrap items-center gap-2">
            <span class="rounded border border-flixer-border px-2 py-1 text-xs capitalize" :data-status="plugin.status">{{ plugin.status }}</span>
            <button v-if="plugin.activationSupported && !plugin.enabled" :class="quietButtonClass" type="button" @click="setEnabled(plugin, true)">
              {{ t('admin.plugins.enable') }}
            </button>
            <button v-if="plugin.enabled" :class="quietButtonClass" type="button" @click="setEnabled(plugin, false)">
              {{ t('admin.plugins.disable') }}
            </button>
            <button v-if="plugin.availableUpdate" :class="quietButtonClass" type="button" :disabled="updating === plugin.id || plugin.enabled" @click="updateInstalled(plugin)">
              {{ updating === plugin.id ? t('admin.plugins.updating') : `${t('admin.plugins.update')} ${plugin.availableUpdate.version}` }}
            </button>
            <button v-if="plugin.manifest.settingsSchema" :class="quietButtonClass" type="button" @click="openSettings(plugin)">
              {{ t('admin.plugins.settings') }}
            </button>
            <button :class="quietButtonClass" type="button" :aria-expanded="historyOpen.includes(plugin.id)" @click="toggleHistory(plugin)">
              {{ historyLoading === plugin.id ? t('admin.plugins.historyLoading') : t('admin.plugins.history') }}
            </button>
            <button v-if="!plugin.enabled" :class="quietButtonClass" type="button" @click="uninstall(plugin)">
              {{ t('admin.plugins.uninstall') }}
            </button>
          </div>
          <ol v-if="historyOpen.includes(plugin.id)" class="mt-4 w-full border-t border-flixer-border pt-3 text-sm">
            <li v-if="!updateHistory[plugin.id]?.length" class="text-flixer-muted">{{ t('admin.plugins.noHistory') }}</li>
            <li v-for="entry in updateHistory[plugin.id]" :key="entry.id" class="py-2 first:pt-0">
              <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span class="font-medium capitalize">{{ entry.action }} {{ entry.outcome }}</span>
                <span class="text-flixer-muted"> {{ entry.fromVersion ? `${entry.fromVersion} → ` : '' }}{{ entry.toVersion }} </span>
                <time class="text-xs text-flixer-muted" :datetime="entry.createdAt">{{ new Date(entry.createdAt).toLocaleString() }}</time>
              </div>
              <p v-if="entry.errorMessage" class="mt-1 text-sm text-red-300">{{ entry.errorMessage }}</p>
            </li>
          </ol>
        </li>
      </ul>
    </AdminSection>

    <AdminSection :title="t('admin.plugins.repositories')" :description="t('admin.plugins.repositoriesDescription')">
      <form class="grid gap-3 sm:grid-cols-[minmax(10rem,0.7fr)_minmax(16rem,1.3fr)_auto] sm:items-end" @submit.prevent="addRepository">
        <label class="grid gap-1 text-sm">
          <span>{{ t('admin.plugins.repositoryName') }}</span>
          <input v-model="name" :class="inputClass" maxlength="120" required autocomplete="off" />
        </label>
        <label class="grid gap-1 text-sm">
          <span>{{ t('admin.plugins.repositoryUrl') }}</span>
          <input v-model="url" :class="inputClass" type="url" maxlength="2048" placeholder="https://example.org/plugins/repository.json" required autocomplete="url" />
        </label>
        <button :class="buttonClass" type="submit" :disabled="isSaving || !name.trim() || !url.trim()">
          {{ isSaving ? t('admin.plugins.saving') : t('admin.plugins.addRepository') }}
        </button>
      </form>

      <p v-if="isLoading && repositories.length === 0" class="mt-5 text-sm text-flixer-muted" role="status">
        {{ t('admin.plugins.loading') }}
      </p>
      <p v-else-if="repositories.length === 0" class="mt-5 text-sm text-flixer-muted">
        {{ t('admin.plugins.noRepositories') }}
      </p>
      <ul v-else class="mt-5 divide-y divide-flixer-border" :aria-label="t('admin.plugins.repositories')">
        <li v-for="repository in repositories" :key="repository.id" class="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="font-medium">{{ repository.name }}</h3>
              <span v-if="repository.isOfficial" class="rounded border border-flixer-accent px-2 py-0.5 text-xs text-flixer-accent">
                {{ t('admin.plugins.official') }}
              </span>
            </div>
            <p class="mt-1 break-all text-xs text-flixer-muted">{{ repository.url }}</p>
            <p v-if="repository.lastError" class="mt-1 text-sm text-red-300" role="status">{{ repository.lastError }}</p>
          </div>
          <div class="flex shrink-0 gap-2">
            <button :class="quietButtonClass" type="button" :disabled="refreshing === repository.id" @click="refreshRepository(repository)">
              {{ refreshing === repository.id ? t('admin.plugins.refreshing') : t('admin.plugins.refresh') }}
            </button>
            <button v-if="!repository.isOfficial" :class="quietButtonClass" type="button" @click="removeRepository(repository)">
              {{ t('admin.plugins.removeRepository') }}
            </button>
          </div>
        </li>
      </ul>
    </AdminSection>

    <AdminSection :title="t('admin.plugins.discover')" :description="t('admin.plugins.discoverDescription')">
      <form class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end" @submit.prevent="load">
        <label class="grid gap-1 text-sm">
          <span>{{ t('admin.plugins.search') }}</span>
          <input v-model="query" :class="inputClass" type="search" maxlength="100" autocomplete="off" />
        </label>
        <label class="grid gap-1 text-sm">
          <span>{{ t('admin.plugins.target') }}</span>
          <select v-model="target" :class="inputClass">
            <option value="">{{ t('admin.plugins.allTargets') }}</option>
            <option value="flixer">Flixer</option>
            <option value="flixer-indexer">Indexer</option>
            <option value="flixer-streamer">Streamer</option>
            <option value="flixer-web">Web</option>
          </select>
        </label>
        <label class="grid gap-1 text-sm">
          <span>{{ t('admin.plugins.capability') }}</span>
          <input v-model="capability" :class="inputClass" maxlength="100" autocomplete="off" />
        </label>
        <button :class="quietButtonClass" type="submit" :disabled="isLoading">{{ t('admin.plugins.search') }}</button>
      </form>
      <p v-if="catalog.length === 0" class="mt-5 text-sm text-flixer-muted">
        {{ isLoading ? t('admin.plugins.loading') : t('admin.plugins.noAvailable') }}
      </p>
      <ul v-else class="mt-5 divide-y divide-flixer-border" :aria-label="t('admin.plugins.discover')">
        <li v-for="plugin in catalog" :key="`${plugin.repository?.id}:${plugin.id}`" class="py-4 first:pt-0 last:pb-0">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <h3 class="font-semibold">{{ plugin.name }}</h3>
                <span class="text-xs text-flixer-muted">{{ plugin.id }}</span>
              </div>
              <p class="mt-1 text-sm text-flixer-muted">{{ plugin.description }}</p>
              <p class="mt-1 text-xs text-flixer-muted">
                {{ t('admin.plugins.byAuthor', { author: plugin.author }) }}
                <span class="mx-1">·</span>{{ plugin.repository?.name }} <span class="mx-1">·</span>{{ plugin.targets.join(', ') }}
              </p>
              <p v-if="plugin.capabilities?.length" class="mt-1 text-xs text-flixer-muted">{{ plugin.capabilities.join(', ') }}</p>
            </div>
            <div class="flex shrink-0 flex-wrap items-center gap-2">
              <template v-if="installations.some((installed) => installed.id === plugin.id)">
                <span class="text-xs text-flixer-muted">{{ t('admin.plugins.alreadyInstalled') }}</span>
              </template>
              <template v-else v-for="release in plugin.versions" :key="release.version">
                <span class="text-xs text-flixer-muted">{{ release.version }}</span>
                <button :class="quietButtonClass" type="button" :disabled="installing === `${plugin.id}:${release.version}`" @click="install(plugin, release.version)">
                  {{ installing === `${plugin.id}:${release.version}` ? t('admin.plugins.installing') : t('admin.plugins.install') }}
                </button>
              </template>
            </div>
          </div>
        </li>
      </ul>
    </AdminSection>
  </div>
</template>
