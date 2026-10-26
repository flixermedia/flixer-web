<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFavorites } from '../../composables/useFavorites'

const props = defineProps<{ itemId: string }>()
const { t } = useI18n()
const favorites = useFavorites()
onMounted(() => void favorites.load().catch(() => undefined))
function toggle() {
  void favorites.toggle(props.itemId).catch(() => undefined)
}
</script>

<template>
  <button type="button" class="grid size-10 shrink-0 place-items-center rounded-lg bg-white/10 text-white transition motion-reduce:transition-none hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" :class="favorites.isFavorite(itemId) ? 'text-rose-400' : 'text-white/70'" :aria-label="t(favorites.isFavorite(itemId) ? 'social.removeFavorite' : 'social.addFavorite')" :aria-pressed="favorites.isFavorite(itemId)" :title="t(favorites.isFavorite(itemId) ? 'social.removeFavorite' : 'social.addFavorite')" @click="toggle">
    <svg class="size-5" viewBox="0 0 24 24" :fill="favorites.isFavorite(itemId) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" /></svg>
  </button>
</template>
