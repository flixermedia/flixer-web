<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { addChatMembers, createChatGroup, getProfiles, startDirectChat, type ChatConversation, type PublicProfileSummary } from '../../api'
import { describeRequestError, useProfile } from '../../composables/useProfile'
import UserAvatar from '../ui/UserAvatar.vue'
import { catchError } from '../../utils/catchError'

defineOptions({ modalGroup: 'default' })
const props = defineProps<{ addTo?: { id: string; usernames: string[] } }>()
const { close, confirm } = useModalContext<ChatConversation>()
const { t } = useI18n()
const { profile } = useProfile()

const mode = ref<'direct' | 'group'>('direct')
const query = ref('')
const people = ref<PublicProfileSummary[]>([])
const loading = ref(true)
const selected = ref<string[]>([])
const name = ref('')
const busy = ref(false)
const error = ref('')
let timer: ReturnType<typeof setTimeout> | undefined
let searchId = 0

const adding = computed(() => props.addTo !== undefined)
const multi = computed(() => adding.value || mode.value === 'group')
const visible = computed(() => people.value.filter((person) => person.username !== profile.value?.username && !props.addTo?.usernames.includes(person.username)))
const canSubmit = computed(() => !busy.value && selected.value.length > 0 && (adding.value || name.value.trim().length > 0))

async function search() {
  const current = ++searchId
  loading.value = true
  try {
    const [failure, result] = await catchError(getProfiles(query.value.trim() || undefined))
    if (failure) {
      if (current === searchId) error.value = t('chat.loadError')
      return
    }
    if (current === searchId) people.value = result.profiles
  } finally {
    if (current === searchId) loading.value = false
  }
}

watch(
  query,
  () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => void search(), 250)
  },
  { immediate: true },
)
watch(mode, () => (selected.value = []))
onBeforeUnmount(() => {
  searchId++
  if (timer) clearTimeout(timer)
})

async function run(action: () => Promise<ChatConversation>) {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    const [failure, result] = await catchError(action())
    if (failure) {
      error.value = describeRequestError(failure, t('chat.createError'))
      return
    }
    confirm(result)
  } finally {
    busy.value = false
  }
}

function pick(person: PublicProfileSummary) {
  if (!multi.value) {
    void run(() => startDirectChat(person.username))
    return
  }
  selected.value = selected.value.includes(person.username) ? selected.value.filter((entry) => entry !== person.username) : [...selected.value, person.username]
}

function submit() {
  if (!canSubmit.value) return
  const usernames = selected.value
  void run(() => (props.addTo ? addChatMembers(props.addTo.id, usernames) : createChatGroup(name.value.trim(), usernames)))
}
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col rounded-2xl border border-flixer-border bg-flixer-surface p-6 text-flixer-text shadow-2xl shadow-black/60">
      <ModalTitle class="text-lg font-semibold text-white">{{ adding ? t('chat.addPeople') : t('chat.newChat') }}</ModalTitle>
      <ModalDescription class="mt-1 text-sm text-flixer-muted">{{ adding ? t('chat.addPeopleHint') : mode === 'direct' ? t('chat.directHint') : t('chat.groupHint') }}</ModalDescription>

      <div v-if="!adding" class="mt-4 grid grid-cols-2 gap-1 rounded-lg bg-white/5 p-1 text-sm font-semibold" role="tablist">
        <button v-for="option in ['direct', 'group'] as const" :key="option" type="button" role="tab" :aria-selected="mode === option" class="rounded-lg px-3 py-1.5 transition motion-reduce:transition-none" :class="mode === option ? 'bg-white text-flixer-background' : 'text-flixer-muted hover:text-white'" @click="mode = option">{{ t(option === 'direct' ? 'chat.direct' : 'chat.group') }}</button>
      </div>

      <input v-if="!adding && mode === 'group'" v-model="name" maxlength="60" class="mt-4 w-full rounded-lg border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-white placeholder:text-flixer-muted focus:outline-none focus:ring-2 focus:ring-flixer-accent" :placeholder="t('chat.groupName')" :aria-label="t('chat.groupName')" />
      <input v-model="query" type="search" class="mt-3 w-full rounded-lg border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-white placeholder:text-flixer-muted focus:outline-none focus:ring-2 focus:ring-flixer-accent" :placeholder="t('chat.searchPeople')" :aria-label="t('chat.searchPeople')" />

      <ul class="mt-3 min-h-40 flex-1 space-y-0.5 overflow-y-auto">
        <li v-if="loading" class="px-2 py-6 text-center text-sm text-flixer-muted">{{ t('common.loading') }}</li>
        <li v-else-if="!visible.length" class="px-2 py-6 text-center text-sm text-flixer-muted">{{ t('chat.noPeople') }}</li>
        <li v-for="person in loading ? [] : visible" :key="person.username">
          <button type="button" class="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition motion-reduce:transition-none hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" :aria-pressed="multi ? selected.includes(person.username) : undefined" :disabled="busy" @click="pick(person)">
            <span class="block size-9 shrink-0 overflow-hidden rounded"><UserAvatar :avatar-url="person.avatarUrl" :name="person.displayName" /></span>
            <span class="min-w-0 flex-1 truncate text-sm font-medium text-white">{{ person.displayName }}</span>
            <span v-if="multi" class="grid size-5 shrink-0 place-items-center rounded border" :class="selected.includes(person.username) ? 'border-flixer-accent bg-flixer-accent text-flixer-background' : 'border-white/30'" aria-hidden="true">
              <Icon v-if="selected.includes(person.username)" icon="lucide:check" class="size-3.5" aria-hidden="true" />
            </span>
          </button>
        </li>
      </ul>

      <p v-if="error" class="mt-2 text-sm text-red-400" role="alert">{{ error }}</p>
      <div class="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" class="h-11 rounded-lg border border-flixer-border px-5 text-sm font-semibold hover:bg-white/5" @click="close()">{{ t('common.cancel') }}</button>
        <button v-if="multi" type="button" class="h-11 rounded-lg bg-white px-5 text-sm font-bold text-flixer-background transition hover:bg-white/85 disabled:opacity-50" :disabled="!canSubmit" @click="submit">{{ adding ? t('chat.add') : t('chat.createGroup') }}</button>
      </div>
    </ModalContent>
  </ModalRoot>
</template>
