<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import AuthImage from '../ui/AuthImage.vue'
import type { ExternalRequestStatus } from '../../api'
import { requestStatusLabelKey } from '../../composables/requestStatus'

const props = withDefaults(
  defineProps<{
    title: string
    itemId?: string
    /** Index of the image to show, or null/undefined when the item has none yet. */
    imageIndex?: number | null
    version?: string
    subtitle?: string
    variant?: 'poster' | 'landscape' | 'library' | 'square'
    progress?: number
    /** Overrides the default link to the item's page. */
    to?: RouteLocationRaw
    /** Shows a corner button that marks the item as watched. */
    markable?: boolean
    posterUrl?: string | null
    requestStatus?: ExternalRequestStatus
  }>(),
  { variant: 'poster' },
)

const emit = defineEmits<{ watched: [] }>()
const { t } = useI18n()

const linkTo = computed(() => props.to ?? (props.variant !== 'library' && props.itemId ? { name: 'media-item', params: { id: props.itemId } } : null))
const statusClass = computed(
  () =>
    ({
      pending: 'border-amber-300/30 bg-amber-300/15 text-amber-100',
      approved: 'border-flixer-accent/30 bg-flixer-accent/15 text-white',
      available: 'border-emerald-300/30 bg-emerald-300/15 text-emerald-100',
      declined: 'border-red-300/30 bg-red-300/15 text-red-100',
      failed: 'border-red-300/30 bg-red-300/15 text-red-100',
      none: '',
    })[props.requestStatus ?? 'none'],
)
</script>

<template>
  <li
    class="group/card relative shrink-0 snap-start"
    :class="{
      'w-36 sm:w-44': variant === 'poster' || variant === 'square',
      'w-64 sm:w-72': variant === 'landscape',
      'w-56 sm:w-64': variant === 'library',
    }"
  >
    <component :is="linkTo ? RouterLink : 'a'" v-bind="linkTo ? { to: linkTo } : { href: '#' }" class="group block rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent">
      <div class="relative overflow-hidden rounded-lg border border-flixer-border bg-flixer-surface transition duration-300 group-hover:-translate-y-1 group-hover:border-white/30 group-hover:shadow-xl group-hover:shadow-black/50" :class="variant === 'poster' ? 'aspect-[2/3]' : variant === 'square' ? 'aspect-square' : 'aspect-video'">
        <img v-if="posterUrl" :src="posterUrl" alt="" loading="lazy" class="size-full object-cover transition duration-500 group-hover:scale-105" />
        <AuthImage v-else-if="itemId && imageIndex !== null && imageIndex !== undefined" scope="library" :item-id="itemId" :index="imageIndex" :version="version" :width="variant === 'landscape' ? 300 : variant === 'library' ? 260 : 200" :alt="variant === 'library' ? '' : title" img-class="size-full object-cover transition duration-500 group-hover:scale-105" />
        <span v-else-if="variant !== 'library'" class="absolute inset-0 grid place-items-center p-3 text-center text-sm font-medium text-flixer-muted">{{ title }}</span>

        <template v-if="variant === 'library'">
          <div class="theme-dark absolute inset-0">
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <span class="absolute inset-x-4 bottom-3 text-lg font-semibold text-white">{{ title }}</span>
          </div>
        </template>

        <template v-else>
          <div class="theme-dark absolute inset-0 grid transition" :class="posterUrl ? 'items-end justify-end bg-gradient-to-t from-black/30 via-transparent to-transparent p-2' : 'place-items-center bg-black/40 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'">
            <span class="grid place-items-center rounded-full border border-white/25 bg-black/65 text-white shadow-lg backdrop-blur transition group-hover:scale-105" :class="posterUrl ? 'size-9 sm:size-10' : 'size-12'">
              <svg v-if="posterUrl" class="size-6" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z" /></svg>
              <svg v-else class="ml-0.5 size-5" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l14 8-14 8z" /></svg>
            </span>
          </div>
          <span v-if="requestStatus && requestStatus !== 'none'" class="absolute left-2 top-2 rounded-full border px-2.5 py-1 text-[10px] font-bold shadow-sm backdrop-blur-md" :class="statusClass" :aria-label="t(requestStatusLabelKey(requestStatus))">{{ t(requestStatusLabelKey(requestStatus)) }}</span>
          <div v-if="progress !== undefined" class="absolute inset-x-0 bottom-0 h-1 bg-white/25">
            <div class="h-full bg-flixer-accent" :style="{ width: `${progress}%` }"></div>
          </div>
        </template>
      </div>

      <div v-if="variant !== 'library'" class="mt-2 px-0.5">
        <p class="truncate text-sm font-medium text-flixer-text">{{ title }}</p>
        <p v-if="subtitle" class="truncate text-xs text-flixer-muted">{{ subtitle }}</p>
      </div>
    </component>
    <button v-if="markable" type="button" class="theme-dark absolute right-2 top-2 grid size-8 place-items-center rounded bg-black/70 text-white opacity-0 transition hover:bg-black/90 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent group-hover/card:opacity-100 [@media(hover:none)]:opacity-100" :aria-label="t('mediaItem.markWatched')" :title="t('mediaItem.markWatched')" @click.stop="emit('watched')">
      <svg class="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" /></svg>
    </button>
  </li>
</template>
