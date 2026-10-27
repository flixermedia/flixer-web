<script setup lang="ts">
import { openModal } from '@kolirt/vue-modal'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute } from 'vue-router'
import logoUrl from '../../../resources/logo/flixer-logo.svg'
import { isActivePath } from '../../composables/homeNav'
import { useProfile } from '../../composables/useProfile'
import type { NavLink } from '../../types/media'
import ChatButton from './ChatButton.vue'
import NotificationBell from './NotificationBell.vue'
import PartyButton from './PartyButton.vue'
import LanguageModal from '../ui/LanguageModal.vue'
import ThemeModal from '../ui/ThemeModal.vue'
import UserAvatar from '../ui/UserAvatar.vue'

const props = withDefaults(
  defineProps<{
    links: NavLink[]
    isSigningOut: boolean
    navPosition?: 'center' | 'start'
    navBackground?: boolean
    docked?: boolean
  }>(),
  { navPosition: 'center', navBackground: true, docked: false },
)

const emit = defineEmits<{ logout: [] }>()

const { t } = useI18n()
const { profile, load: loadProfile } = useProfile()
const menuOpen = ref(false)
const scrolledPast = ref(false)
const scrolled = computed(() => props.docked || scrolledPast.value)
const menuRoot = ref<HTMLElement | null>(null)
const route = useRoute()

function openLanguage() {
  menuOpen.value = false
  void openModal(LanguageModal).catch(() => undefined)
}

function openTheme() {
  menuOpen.value = false
  void openModal(ThemeModal).catch(() => undefined)
}

function onScroll() {
  scrolledPast.value = window.scrollY > 24
}

function onPointerDown(event: PointerEvent) {
  if (menuOpen.value && menuRoot.value && !menuRoot.value.contains(event.target as Node)) {
    menuOpen.value = false
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    menuOpen.value = false
  }
}

onMounted(() => {
  void loadProfile()
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  document.addEventListener('pointerdown', onPointerDown)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  document.removeEventListener('pointerdown', onPointerDown)
  document.removeEventListener('keydown', onKeydown)
})

const iconButton = 'grid size-10 place-items-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent'
</script>

<template>
  <header class="app-header fixed inset-x-0 top-0 z-40 transition-[top,padding] duration-300 ease-out" :class="scrolled ? 'is-scrolled p-0' : 'px-3 pt-3 sm:px-6 sm:pt-4'">
    <nav data-haptic class="mx-auto grid h-16 grid-cols-[auto_1fr] items-center gap-4 border px-3 backdrop-blur-xl transition-all duration-300 ease-out md:px-4" :class="[navPosition === 'start' ? 'md:grid-cols-[auto_auto_1fr]' : 'md:grid-cols-[1fr_auto_1fr]', scrolled ? 'max-w-full rounded-none border-x-0 border-t-0 border-white/10 bg-flixer-background/85 shadow-lg shadow-black/40 sm:px-8 md:px-8' : 'max-w-[110rem] rounded-lg border-white/10 bg-flixer-background/30']" :aria-label="t('header.mainNavigation')">
      <RouterLink class="flex items-center gap-2.5 justify-self-start rounded-lg pr-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" to="/" :aria-label="t('header.flixerHome')">
        <img :src="logoUrl" alt="" class="size-10" />
        <span class="text-xl font-semibold tracking-tight text-white">Flixer</span>
      </RouterLink>

      <div class="hidden md:block" :class="navPosition === 'start' ? 'justify-self-start' : 'justify-self-center'">
        <slot name="nav">
          <ul v-if="links.length" class="flex items-center gap-1 rounded-lg p-1" :class="navBackground ? 'bg-white/5' : ''">
            <li v-for="link in links" :key="link.to">
              <RouterLink :to="link.to" class="block rounded-md px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" :class="isActivePath(route.path, link.to) ? 'bg-white/15 text-white' : 'text-flixer-text/70 hover:text-white'" :aria-current="isActivePath(route.path, link.to) ? 'page' : undefined">{{ link.label }}</RouterLink>
            </li>
          </ul>
        </slot>
      </div>

      <div class="flex items-center justify-self-end gap-1">
        <RouterLink :to="{ name: 'search' }" :class="iconButton" :aria-label="t('header.search')">
          <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 21l-4.3-4.3M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" />
          </svg>
        </RouterLink>

        <ChatButton :button-class="`relative ${iconButton}`" />

        <PartyButton :button-class="`relative ${iconButton}`" />

        <NotificationBell :button-class="`relative ${iconButton}`" />

        <div ref="menuRoot" class="relative">
          <button type="button" class="grid size-10 place-items-center rounded-lg transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" :aria-label="t('header.accountMenu')" aria-haspopup="menu" :aria-expanded="menuOpen" @click="menuOpen = !menuOpen">
            <span class="block size-10 overflow-hidden rounded-lg text-sm">
              <UserAvatar :avatar-url="profile?.avatarUrl" :name="profile?.displayName" />
            </span>
          </button>

          <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="translate-y-1 opacity-0" leave-active-class="transition duration-100 ease-in" leave-to-class="translate-y-1 opacity-0">
            <div v-if="menuOpen" class="absolute right-0 top-full mt-3 w-56 origin-top-right rounded-lg border border-white/10 bg-flixer-surface/95 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-xl" role="menu">
              <div v-if="profile" class="px-3 py-2.5">
                <p class="truncate text-sm font-semibold text-white">{{ profile.displayName }}</p>
                <p class="truncate text-xs text-flixer-muted">{{ profile.username }}</p>
              </div>
              <div v-if="profile" class="my-1.5 h-px bg-white/10"></div>
              <RouterLink v-if="profile" :to="{ name: 'profile', params: { username: profile.username } }" class="flex items-center rounded-md px-3 py-2.5 text-sm text-flixer-text transition hover:bg-white/10" role="menuitem" @click="menuOpen = false">{{ t('header.profile') }}</RouterLink>
              <RouterLink to="/people" class="flex items-center rounded-md px-3 py-2.5 text-sm text-flixer-text transition hover:bg-white/10" role="menuitem" @click="menuOpen = false">{{ t('header.people') }}</RouterLink>
              <button type="button" class="flex w-full items-center rounded-md px-3 py-2.5 text-left text-sm text-flixer-text transition hover:bg-white/10" role="menuitem" @click="openLanguage">{{ t('header.language') }}</button>
              <button type="button" class="flex w-full items-center rounded-md px-3 py-2.5 text-left text-sm text-flixer-text transition hover:bg-white/10" role="menuitem" @click="openTheme">{{ t('header.theme') }}</button>
              <RouterLink v-if="profile?.role === 'admin'" to="/admin" class="flex items-center rounded-md px-3 py-2.5 text-sm text-flixer-text transition hover:bg-white/10" role="menuitem" @click="menuOpen = false">{{ t('header.administration') }}</RouterLink>
              <RouterLink to="/settings" class="flex items-center rounded-md px-3 py-2.5 text-sm text-flixer-text transition hover:bg-white/10" role="menuitem" @click="menuOpen = false">{{ t('header.settings') }}</RouterLink>
              <div class="my-1.5 h-px bg-white/10"></div>
              <button type="button" class="flex w-full items-center rounded-md px-3 py-2.5 text-left text-sm text-flixer-text transition hover:bg-white/10 disabled:cursor-wait disabled:opacity-70" role="menuitem" :disabled="isSigningOut" @click="emit('logout')">
                {{ isSigningOut ? t('header.signingOut') : t('header.signOut') }}
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </nav>
  </header>
</template>

<style scoped>
html.capacitor .app-header {
  top: max(env(safe-area-inset-top, 0px), 3.5rem);
}

html.capacitor .app-header.is-scrolled {
  top: 0;
  padding-top: max(env(safe-area-inset-top, 0px), 3.5rem);
  background: var(--color-flixer-background);
}

html.capacitor .app-header.is-scrolled nav {
  padding-bottom: 10px;
}
</style>
