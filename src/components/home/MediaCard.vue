<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    image: string
    subtitle?: string
    variant?: 'poster' | 'landscape' | 'library'
    progress?: number
  }>(),
  { variant: 'poster' },
)
</script>

<template>
  <li
    class="shrink-0 snap-start"
    :class="{
      'w-36 sm:w-44': variant === 'poster',
      'w-64 sm:w-72': variant === 'landscape',
      'w-56 sm:w-64': variant === 'library',
    }"
  >
    <a href="#" class="group block rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent">
      <div class="relative overflow-hidden rounded-lg border border-flixer-border bg-flixer-surface transition duration-300 group-hover:-translate-y-1 group-hover:border-white/30 group-hover:shadow-xl group-hover:shadow-black/50" :class="variant === 'poster' ? 'aspect-[2/3]' : 'aspect-video'">
        <img :src="image" :alt="variant === 'library' ? '' : title" loading="lazy" class="size-full object-cover transition duration-500 group-hover:scale-105" />

        <template v-if="variant === 'library'">
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          <span class="absolute inset-x-4 bottom-3 text-lg font-semibold text-white">{{ title }}</span>
        </template>

        <template v-else>
          <div class="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
            <span class="grid size-12 place-items-center rounded-full bg-white/90 text-flixer-background">
              <svg class="ml-0.5 size-5" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l14 8-14 8z" /></svg>
            </span>
          </div>
          <div v-if="progress !== undefined" class="absolute inset-x-0 bottom-0 h-1 bg-white/25">
            <div class="h-full bg-flixer-accent" :style="{ width: `${progress}%` }"></div>
          </div>
        </template>
      </div>

      <div v-if="variant !== 'library'" class="mt-2 px-0.5">
        <p class="truncate text-sm font-medium text-flixer-text">{{ title }}</p>
        <p v-if="subtitle" class="truncate text-xs text-flixer-muted">{{ subtitle }}</p>
      </div>
    </a>
  </li>
</template>
