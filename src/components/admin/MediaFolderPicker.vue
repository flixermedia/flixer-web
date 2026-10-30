<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { browseMediaFolders, listMediaRoots, type MediaRoot } from '../../api'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'

export interface PickedFolder {
  rootId: string
  path: string
  label: string
}

defineOptions({ modalGroup: 'default' })

const { close, confirm } = useModalContext<PickedFolder[]>()
const { t } = useI18n()

const roots = ref<MediaRoot[]>([])
const rootId = ref('')
const path = ref('')
const pathInput = ref('/')
const directories = ref<string[]>([])
const selectedPaths = ref<string[]>([])
const loading = ref(false)
const error = ref('')
let requestId = 0

const segments = () => (path.value ? path.value.split('/') : [])
const currentRoot = () => roots.value.find((root) => root.id === rootId.value)

function normalizePath(value: string) {
  return value.trim().replace(/^\/+|\/+$/g, '')
}

function fullPath(relativePath: string) {
  const rootPath = currentRoot()?.path.replace(/\/+$/g, '') ?? ''
  return [rootPath, relativePath].filter(Boolean).join('/') || '/'
}

async function load() {
  if (!rootId.value) return

  const thisRequest = ++requestId
  const requestedRootId = rootId.value
  const requestedPath = path.value
  loading.value = true

  try {
    const [requestError, result] = await catchError(browseMediaFolders(requestedRootId, requestedPath))
    if (thisRequest !== requestId) return

    if (requestError) {
      directories.value = []
      error.value = describeRequestError(requestError, t('admin.libraries.browseError'))
    } else {
      directories.value = result.directories
      error.value = ''
    }
  } finally {
    if (thisRequest === requestId) loading.value = false
  }
}

function navigate(nextPath: string) {
  path.value = normalizePath(nextPath)
  pathInput.value = path.value ? `/${path.value}` : '/'
  void load()
}

function openRoot(id: string) {
  rootId.value = id
  selectedPaths.value = []
  navigate('')
}

function backToRoots() {
  rootId.value = ''
  selectedPaths.value = []
}

function open(name: string) {
  navigate(path.value ? `${path.value}/${name}` : name)
}

function goUp() {
  navigate(segments().slice(0, -1).join('/'))
}

function browseToInput() {
  navigate(pathInput.value)
}

function toggleFolder(name: string) {
  const folderPath = path.value ? `${path.value}/${name}` : name
  selectedPaths.value = selectedPaths.value.includes(folderPath)
    ? selectedPaths.value.filter((selectedPath) => selectedPath !== folderPath)
    : [...selectedPaths.value, folderPath]
}

function choose() {
  const root = currentRoot()
  if (!root) return

  const paths = selectedPaths.value.length ? selectedPaths.value : [path.value]
  confirm(paths.map((folderPath) => ({
    rootId: root.id,
    path: folderPath,
    label: [root.name, ...folderPath.split('/').filter(Boolean)].join(' / '),
  })))
}

onMounted(async () => {
  const [requestError, result] = await catchError(listMediaRoots())
  if (requestError) {
    error.value = describeRequestError(requestError, t('admin.libraries.browseError'))
    return
  }

  roots.value = result
  if (roots.value.length === 1) openRoot(roots.value[0].id)
})
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col rounded border border-flixer-border bg-flixer-surface p-5 text-flixer-text shadow-2xl shadow-black/60 sm:p-7">
      <header class="flex shrink-0 items-start justify-between gap-4">
        <div>
          <ModalTitle class="text-xl font-semibold">{{ t('admin.libraries.browseFolders') }}</ModalTitle>
          <ModalDescription class="sr-only">{{ t('admin.libraries.pickerDescription') }}</ModalDescription>
        </div>
        <button type="button" class="grid size-8 shrink-0 place-items-center rounded text-flixer-muted transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" :aria-label="t('admin.libraries.cancel')" @click="close()">
          <Icon icon="lucide:x" class="size-5" aria-hidden="true" />
        </button>
      </header>

      <p v-if="error" role="alert" class="mt-3 shrink-0 text-sm text-red-300">{{ error }}</p>

      <div v-if="!rootId" class="mt-5 min-h-0 flex-1 overflow-y-auto">
        <p class="text-sm font-medium text-flixer-muted">{{ t('admin.libraries.chooseRoot') }}</p>
        <p v-if="roots.length === 0 && !error" class="mt-3 text-sm text-flixer-muted">{{ t('admin.libraries.noRoots') }}</p>
        <ul class="mt-3 grid gap-2">
          <li v-for="root in roots" :key="root.id">
            <button type="button" class="w-full rounded border border-flixer-border bg-flixer-background/70 px-4 py-3 text-left transition hover:border-flixer-accent/50 hover:bg-white/5" @click="openRoot(root.id)">
              <span class="block font-medium">{{ root.name }}</span>
              <span class="mt-1 block truncate font-mono text-sm text-flixer-muted">{{ root.path }}</span>
            </button>
          </li>
        </ul>
      </div>

      <template v-else>
        <form class="mt-5 flex shrink-0 gap-2" @submit.prevent="browseToInput">
          <input v-model="pathInput" type="text" :aria-label="t('admin.libraries.folderPath')" class="min-w-0 flex-1 rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-flixer-text outline-none transition focus:border-flixer-accent" @keydown.enter.prevent="browseToInput" />
          <button type="submit" class="shrink-0 rounded border border-flixer-border px-4 py-2 text-sm font-medium transition hover:bg-white/10 disabled:opacity-50" :disabled="loading">{{ t('admin.libraries.browse') }}</button>
        </form>

        <section class="mt-3 flex min-h-64 flex-1 flex-col overflow-hidden rounded border border-flixer-border">
          <div class="flex shrink-0 items-center justify-between gap-3 border-b border-flixer-border px-4 py-3">
            <div class="min-w-0">
              <p class="text-sm font-medium">{{ t('admin.libraries.currentFolder') }}</p>
              <p class="mt-0.5 truncate font-mono text-sm text-flixer-muted">{{ fullPath(path) }}</p>
            </div>
            <div class="flex shrink-0 items-center gap-1">
              <button v-if="roots.length > 1" type="button" class="rounded px-2 py-1.5 text-sm text-flixer-muted transition hover:bg-white/10 hover:text-white" @click="backToRoots">{{ t('admin.libraries.roots') }}</button>
              <button type="button" class="inline-flex items-center gap-1 rounded px-2 py-1.5 text-sm text-flixer-muted transition hover:bg-white/10 hover:text-white disabled:opacity-40" :aria-label="t('admin.libraries.goUp')" :title="t('admin.libraries.goUp')" :disabled="!path || loading" @click="goUp">
                <Icon icon="lucide:arrow-up" class="size-4" aria-hidden="true" />
                <span>{{ t('admin.libraries.goUp') }}</span>
              </button>
              <button type="button" class="grid size-9 place-items-center rounded text-flixer-muted transition hover:bg-white/10 hover:text-white disabled:opacity-40" :aria-label="t('admin.libraries.refresh')" :title="t('admin.libraries.refresh')" :disabled="loading" @click="load">
                <Icon icon="lucide:refresh-cw" class="size-4" :class="loading ? 'animate-spin' : ''" aria-hidden="true" />
              </button>
            </div>
          </div>

          <ul class="min-h-0 flex-1 overflow-y-auto p-2" :aria-label="t('admin.libraries.currentFolder')">
            <li v-if="loading && directories.length === 0" class="px-3 py-4 text-sm text-flixer-muted" role="status">{{ t('admin.libraries.browseLoading') }}</li>
            <li v-for="name in directories" :key="name" class="flex items-center gap-2 rounded px-2 py-1 transition hover:bg-white/5">
              <input type="checkbox" class="size-4 shrink-0 accent-flixer-accent" :checked="selectedPaths.includes(path ? `${path}/${name}` : name)" :aria-label="t('admin.libraries.selectFolderName', { folder: name })" @click.stop @change="toggleFolder(name)" />
              <Icon icon="lucide:folder" class="size-5 shrink-0 text-flixer-muted" aria-hidden="true" />
              <button type="button" class="min-w-0 flex-1 truncate py-1 text-left text-sm transition hover:text-flixer-accent disabled:opacity-50" :disabled="loading" @click="open(name)">{{ name }}</button>
            </li>
            <li v-if="!loading && directories.length === 0 && !error" class="px-3 py-4 text-sm text-flixer-muted">{{ t('admin.libraries.noSubfolders') }}</li>
          </ul>
        </section>

        <footer class="mt-4 flex shrink-0 flex-wrap items-center justify-between gap-3">
          <p class="text-sm text-flixer-muted">{{ t('admin.libraries.selectFoldersHint') }}</p>
          <div class="flex justify-end gap-2">
            <button type="button" class="rounded border border-flixer-border px-4 py-2 text-sm font-medium transition hover:bg-white/10" @click="close()">{{ t('admin.libraries.cancel') }}</button>
            <button type="button" class="rounded bg-flixer-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-flixer-primary/80" @click="choose">{{ t(selectedPaths.length ? 'admin.libraries.useSelectedFolders' : 'admin.libraries.useCurrentFolder') }}</button>
          </div>
        </footer>
      </template>
    </ModalContent>
  </ModalRoot>
</template>
