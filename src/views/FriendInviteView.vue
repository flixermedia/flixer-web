<script setup lang="ts">
import axios from 'axios'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute } from 'vue-router'
import { acceptFriendInvite, getFriendInvite, type FriendInvite } from '../api'
import Header from '../components/header/Header.vue'
import MobileTabBar from '../components/home/MobileTabBar.vue'
import UserAvatar from '../components/ui/UserAvatar.vue'
import { getMobileTabs, getNavLinks } from '../composables/homeNav'
import { notify } from '../composables/notify'
import { useSignOut } from '../composables/useSignOut'
import { catchError } from '../utils/catchError'

const { t } = useI18n()
const route = useRoute()
const { isSigningOut, signOut } = useSignOut()
const navLinks = computed(getNavLinks)
const mobileTabs = computed(getMobileTabs)
const invite = ref<FriendInvite | null>(null)
const loading = ref(true)
const failed = ref(false)
const busy = ref(false)
const token = computed(() => String(route.params.token ?? ''))

async function loadInvite() {
  loading.value = true
  failed.value = false
  try {
    const [error, value] = await catchError(getFriendInvite(token.value))
    if (error) {
      failed.value = true
      invite.value = null
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        document.title = `${t('social.friendInvite.invalid')} · Flixer`
      }
    } else {
      invite.value = value
    }
  } finally {
    loading.value = false
  }
}

async function updateFriendship() {
  const person = invite.value
  if (!person || busy.value) return
  busy.value = true
  try {
    if (person.friendship !== 'friends' && person.friendship !== 'self') {
      const [error] = await catchError(acceptFriendInvite(token.value))
      if (error) {
        notify.error(t('social.friendInvite.requestFailed'))
        return
      }
    }
    invite.value = { ...person, friendship: 'friends' }
  } finally {
    busy.value = false
  }
}

const actionLabel = computed(() => {
  switch (invite.value?.friendship) {
    case 'none':
    case 'incoming':
    case 'outgoing':
      return t('social.friendInvite.accept')
    case 'friends':
      return t('social.friendInvite.alreadyFriends')
    case 'self':
      return t('social.friendInvite.self')
    default:
      return ''
  }
})

watch(token, () => void loadInvite(), { immediate: true })
</script>

<template>
  <div class="min-h-screen bg-flixer-background pb-24 font-sans text-flixer-text md:pb-12">
    <Header :links="navLinks" :is-signing-out="isSigningOut" @logout="signOut" />
    <main class="page-gutter pt-28 sm:pt-32">
      <section class="mx-auto max-w-lg rounded border border-white/10 bg-flixer-surface/60 p-6 text-center sm:p-8">
        <p v-if="loading" class="text-sm text-flixer-muted" role="status">{{ t('common.loading') }}</p>
        <div v-else-if="failed" role="alert">
          <h1 class="text-xl font-semibold text-white">{{ t('social.friendInvite.invalid') }}</h1>
          <RouterLink to="/people" class="mt-4 inline-block text-sm text-flixer-accent hover:underline">{{ t('social.people') }}</RouterLink>
        </div>
        <template v-else-if="invite">
          <UserAvatar :avatar-url="invite.avatarUrl" :name="invite.displayName" class="mx-auto size-24 text-3xl" />
          <h1 class="mt-4 break-words text-2xl font-bold text-white">{{ invite.displayName }}</h1>
          <p class="mt-1 text-sm text-flixer-muted">@{{ invite.username }}</p>
          <p class="mt-4 text-sm text-flixer-muted">{{ t('social.friendInvite.description') }}</p>
          <button v-if="invite.friendship !== 'friends' && invite.friendship !== 'self'" type="button" class="mt-6 rounded bg-white px-5 py-2.5 text-sm font-bold text-flixer-background transition hover:bg-white/85 disabled:opacity-60" :disabled="busy" @click="updateFriendship">
            {{ actionLabel }}
          </button>
          <p v-else class="mt-6 text-sm font-semibold text-flixer-muted" role="status">{{ actionLabel }}</p>
        </template>
      </section>
    </main>
    <MobileTabBar :tabs="mobileTabs" />
  </div>
</template>
