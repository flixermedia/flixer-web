<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import logoUrl from '../../../resources/logo/flixer-logo.svg'
import { useAudioPlayer } from '../../composables/useAudioPlayer'
import AuthImage from './AuthImage.vue'

const { t, locale } = useI18n()
const { current, isPlaying } = useAudioPlayer()

const now = ref(new Date())
let tick: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  tick = setInterval(() => (now.value = new Date()), 10_000)
})
onBeforeUnmount(() => clearInterval(tick))

const time = () => now.value.toLocaleTimeString(locale.value, { hour: 'numeric', minute: '2-digit' })
const date = () => now.value.toLocaleDateString(locale.value, { weekday: 'long', month: 'long', day: 'numeric' })
</script>

<template>
  <div class="idle-splash fixed inset-0 z-[100] cursor-none select-none overflow-hidden bg-flixer-background" role="dialog" aria-modal="true" :aria-label="t('idle.title')">
    <div class="orb orb-a" aria-hidden="true"></div>
    <div class="orb orb-b" aria-hidden="true"></div>
    <div class="orb orb-c" aria-hidden="true"></div>

    <div class="drift absolute inset-0 grid place-items-center">
      <div class="flex flex-col items-center gap-6 text-center">
        <img :src="logoUrl" alt="" class="logo size-28 sm:size-36" />
        <p class="text-4xl font-semibold tracking-tight text-white sm:text-5xl">Flixer</p>
        <div>
          <p class="text-3xl font-light tabular-nums text-white/90">{{ time() }}</p>
          <p class="mt-1 text-sm text-flixer-muted">{{ date() }}</p>
        </div>
        <div v-if="current && isPlaying" class="flex max-w-xs items-center gap-3 rounded-lg bg-white/5 p-2 pr-4 text-left backdrop-blur">
          <div class="size-12 shrink-0 overflow-hidden rounded bg-flixer-surface">
            <AuthImage v-if="current.art" scope="library" :item-id="current.art.itemId" :index="current.art.index" :version="current.art.version" :width="96" alt="" />
          </div>
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold text-white">{{ current.title }}</p>
            <p v-if="current.artist" class="truncate text-xs text-flixer-muted">{{ current.artist }}</p>
          </div>
        </div>
      </div>
    </div>

    <p class="absolute inset-x-0 bottom-6 text-center text-xs text-flixer-muted/70">{{ t('idle.hint') }}</p>
  </div>
</template>

<style scoped>
.logo {
  animation: logo-breathe 6s ease-in-out infinite;
  filter: drop-shadow(0 0 32px color-mix(in srgb, var(--color-flixer-accent) 55%, transparent));
}

/* The whole group wanders slowly so no pixel stays lit long enough to burn in. */
.drift {
  animation: drift 90s ease-in-out infinite alternate;
}

.orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(90px);
  opacity: 0.35;
  background: var(--color-flixer-accent);
}
.orb-a {
  width: 28rem;
  height: 28rem;
  left: -6rem;
  top: -4rem;
  animation: orb-a 38s ease-in-out infinite alternate;
}
.orb-b {
  width: 24rem;
  height: 24rem;
  right: -5rem;
  bottom: -3rem;
  opacity: 0.25;
  animation: orb-b 46s ease-in-out infinite alternate;
}
.orb-c {
  width: 18rem;
  height: 18rem;
  left: 45%;
  top: 55%;
  opacity: 0.18;
  animation: orb-a 52s ease-in-out infinite alternate-reverse;
}

@keyframes logo-breathe {
  50% {
    transform: scale(1.06);
  }
}
@keyframes drift {
  0% {
    transform: translate(-6vw, -5vh);
  }
  50% {
    transform: translate(5vw, 4vh);
  }
  100% {
    transform: translate(-3vw, 6vh);
  }
}
@keyframes orb-a {
  to {
    transform: translate(40vw, 30vh) scale(1.3);
  }
}
@keyframes orb-b {
  to {
    transform: translate(-45vw, -25vh) scale(0.8);
  }
}

@media (prefers-reduced-motion: reduce) {
  .logo,
  .drift,
  .orb {
    animation: none;
  }
}
</style>
