<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { getParty, type PartySnapshot } from '../api'
import Header from '../components/header/Header.vue'
import AuthImage from '../components/ui/AuthImage.vue'
import UserAvatar from '../components/ui/UserAvatar.vue'
import { useParty } from '../composables/useParty'
import { getNavLinks } from '../composables/homeNav'
import { useSignOut } from '../composables/useSignOut'
import { catchError } from '../utils/catchError'

const props = defineProps<{ id: string }>()
const { t } = useI18n()
const router = useRouter()
const party = useParty()
const { isSigningOut, signOut } = useSignOut()
const navLinks = computed(getNavLinks)

const snapshot = ref<PartySnapshot | null>(null)
const loading = ref(true)
const gone = ref(false)
const joining = ref(false)
const error = ref('')
const music = computed(() => snapshot.value?.kind === 'music')

onMounted(async () => {
  try {
    const [error, value] = await catchError(getParty(props.id))
    if (error) {
      gone.value = true
    } else {
      snapshot.value = value
    }
  } finally {
    loading.value = false
  }
})

async function join() {
  joining.value = true
  error.value = ''
  try {
    const [joinError, joined] = await catchError(party.join(props.id))
    if (joinError) {
      error.value = joinError instanceof Error ? joinError.message : t('party.joinFailed')
      return
    }
    const [navigationError] = await catchError(router.replace({ name: 'profile', params: { username: joined.host.username } }))
    if (navigationError) error.value = navigationError instanceof Error ? navigationError.message : t('party.joinFailed')
  } finally {
    joining.value = false
  }
}
</script>

<template>
  <div class="min-h-screen overflow-x-hidden bg-flixer-background pb-24 font-sans text-flixer-text md:pb-12">
    <Header :links="navLinks" :is-signing-out="isSigningOut" @logout="signOut" />
    <main class="page-gutter pt-28 sm:pt-32">
      <p v-if="loading" class="text-sm text-flixer-muted" role="status">{{ t('common.loading') }}</p>
      <section v-else-if="gone || !snapshot" class="mx-auto max-w-lg rounded border border-white/10 bg-flixer-surface/60 p-8 text-center">
        <h1 class="text-xl font-semibold text-white">{{ t('party.endedTitle') }}</h1>
        <p class="mt-2 text-sm text-flixer-muted">{{ t('party.endedDescription') }}</p>
        <RouterLink to="/people" class="mt-4 inline-block text-sm text-flixer-accent hover:underline">{{ t('social.people') }}</RouterLink>
      </section>
      <section v-else class="mx-auto max-w-lg overflow-hidden rounded border border-white/10 bg-flixer-surface/60">
        <div class="flex items-center gap-4 p-5">
          <div class="relative size-24 shrink-0 overflow-hidden rounded bg-flixer-surface shadow-lg shadow-black/40" :class="music ? 'aspect-square' : ''">
            <AuthImage v-if="snapshot.item.imageIndex !== null" scope="library" :item-id="snapshot.item.imageItemId" :index="snapshot.item.imageIndex" :version="snapshot.item.imageUpdatedAt" :width="240" :alt="snapshot.item.title" />
          </div>
          <div class="min-w-0">
            <p class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-300"><span class="size-2 animate-pulse rounded-full bg-emerald-400 motion-reduce:animate-none" aria-hidden="true" />{{ t(music ? 'party.listeningTogether' : 'party.watchingTogether') }}</p>
            <h1 class="mt-1 truncate text-xl font-bold text-white">{{ snapshot.item.title }}</h1>
            <p v-if="snapshot.item.subtitle" class="truncate text-sm text-flixer-muted">{{ snapshot.item.subtitle }}</p>
            <p class="mt-1 text-sm text-flixer-muted">{{ t('party.hostedBy', { name: snapshot.host.displayName }) }}</p>
          </div>
        </div>
        <div class="border-t border-white/10 px-5 py-4">
          <p class="text-xs uppercase tracking-wide text-flixer-muted">{{ t('party.inThisParty', { count: snapshot.members.length }) }}</p>
          <ul class="mt-3 flex flex-wrap gap-2">
            <li v-for="member in snapshot.members" :key="member.id" class="flex items-center gap-2 rounded bg-white/10 py-1 pl-1 pr-2 text-xs text-white">
              <span class="block size-5 shrink-0 overflow-hidden rounded"><UserAvatar :avatar-url="member.avatarUrl" :name="member.displayName" class="text-[10px]" /></span>
              {{ member.displayName }}
            </li>
          </ul>
          <p v-if="error" class="mt-3 text-sm text-red-400" role="alert">{{ error }}</p>
          <button type="button" class="mt-4 w-full rounded bg-white px-4 py-3 text-sm font-bold text-flixer-background transition hover:bg-white/85 disabled:opacity-60" :disabled="joining" @click="join">{{ joining ? t('common.loading') : t('party.join') }}</button>
        </div>
      </section>
    </main>
  </div>
</template>
