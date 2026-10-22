<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { browseMediaFolders, listMediaRoots, type MediaRoot } from '../../api'
import { describeRequestError } from '../../composables/useProfile'

export interface PickedFolder {
  rootId: string
  path: string
  label: string
}

defineOptions({ modalGroup: 'default' })

const { close, confirm } = useModalContext<PickedFolder>()
const { t } = useI18n()

const roots = ref<MediaRoot[]>([])
const rootId = ref('')
const path = ref('')
const directories = ref<string[]>([])
const loading = ref(false)
const error = ref('')

const segments = () => (path.value ? path.value.split('/') : [])
const currentRoot = () => roots.value.find((root) => root.id === rootId.value)

async function load() {
  if (!rootId.value) return
  loading.value = true
  try {
    const result = await browseMediaFolders(rootId.value, path.value)
    directories.value = result.directories
    error.value = ''
  } catch (err: unknown) {
    directories.value = []
    error.value = describeRequestError(err, t('admin.libraries.browseError'))
  } finally {
    loading.value = false
  }
}

function openRoot(id: string) {
  rootId.value = id
  path.value = ''
  void load()
}

function open(name: string) {
  path.value = path.value ? `${path.value}/${name}` : name
  void load()
}

function goTo(depth: number) {
  path.value = segments().slice(0, depth).join('/')
  void load()
}

function choose() {
  const root = currentRoot()
  if (!root) return
  confirm({ rootId: root.id, path: path.value, label: [root.name, ...segments()].join(' / ') })
}

onMounted(async () => {
  try {
    roots.value = await listMediaRoots()
    if (roots.value.length === 1) openRoot(roots.value[0].id)
  } catch (err: unknown) {
    error.value = describeRequestError(err, t('admin.libraries.browseError'))
  }
})
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col rounded-2xl border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <ModalTitle class="shrink-0 text-lg font-semibold">{{ t('admin.libraries.addFolder') }}</ModalTitle>
      <ModalDescription class="mt-1 shrink-0 text-sm leading-6 text-flixer-muted">{{ t('admin.libraries.pickerDescription') }}</ModalDescription>
      <div class="mt-4 min-h-24 flex-1 overflow-y-auto">
    <p v-if="error" role="alert" class="mb-2 text-xs text-red-300">{{ error }}</p>

    <template v-if="!rootId">
      <p class="text-xs font-semibold text-flixer-muted">{{ t('admin.libraries.chooseRoot') }}</p>
      <p v-if="roots.length === 0 && !error" class="mt-2 text-xs text-flixer-muted">{{ t('admin.libraries.noRoots') }}</p>
      <ul class="mt-2 grid gap-1">
        <li v-for="root in roots" :key="root.id">
          <button type="button" class="w-full rounded bg-white/5 px-3 py-2 text-left text-xs transition hover:bg-white/10" @click="openRoot(root.id)">
            <span class="font-semibold">{{ root.name }}</span>
            <span class="ml-2 font-mono text-flixer-muted">{{ root.path }}</span>
          </button>
        </li>
      </ul>
    </template>

    <template v-else>
      <nav class="flex flex-wrap items-center gap-1 text-xs" :aria-label="t('admin.libraries.currentFolder')">
        <button v-if="roots.length > 1" type="button" class="text-flixer-accent hover:underline" @click="rootId = ''">{{ t('admin.libraries.roots') }}</button>
        <span v-if="roots.length > 1" class="text-flixer-muted">/</span>
        <button type="button" class="text-flixer-accent hover:underline" @click="goTo(0)">{{ currentRoot()?.name }}</button>
        <template v-for="(segment, index) in segments()" :key="index">
          <span class="text-flixer-muted">/</span>
          <button type="button" class="text-flixer-accent hover:underline" @click="goTo(index + 1)">{{ segment }}</button>
        </template>
      </nav>

      <ul class="mt-2 grid max-h-56 gap-1 overflow-y-auto">
        <li v-for="name in directories" :key="name">
          <button type="button" class="w-full rounded bg-white/5 px-3 py-1.5 text-left text-xs transition hover:bg-white/10" @click="open(name)">📁 {{ name }}</button>
        </li>
        <li v-if="!loading && directories.length === 0 && !error" class="px-1 text-xs text-flixer-muted">{{ t('admin.libraries.noSubfolders') }}</li>
      </ul>
    </template>

      </div>
      <div class="mt-5 flex shrink-0 justify-end gap-2">
      <button v-if="rootId" type="button" class="rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80" @click="choose">{{ t('admin.libraries.selectFolder') }}</button>
      <button type="button" class="rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15" @click="close()">{{ t('admin.libraries.cancel') }}</button>
    </div>
    </ModalContent>
  </ModalRoot>
</template>
