<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFavorites } from '../../composables/useFavorites'

const props = defineProps<{ itemId: string; compact?: boolean }>()
const { t } = useI18n()
const favorites = useFavorites()
onMounted(() => void favorites.load().catch(() => undefined))
function toggle() {
  void favorites.toggle(props.itemId).catch(() => undefined)
}
</script>

<template>
  <button type="button" class="shrink-0 transition motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" :class="[compact ? 'grid size-10 place-items-center rounded bg-white/10 text-white hover:bg-white/20' : 'inline-flex h-12 w-12 items-center justify-center rounded-lg border border-white/30 bg-white/10 text-white hover:bg-white/20', favorites.isFavorite(itemId) ? 'text-rose-400' : compact ? '' : 'text-white/70']" :aria-label="t(favorites.isFavorite(itemId) ? 'social.removeFavorite' : 'social.addFavorite')" :aria-pressed="favorites.isFavorite(itemId)" :title="t(favorites.isFavorite(itemId) ? 'social.removeFavorite' : 'social.addFavorite')" @click="toggle">
    <Icon :icon="favorites.isFavorite(itemId) ? 'lucide:heart' : 'lucide:heart'" class="size-5" :class="favorites.isFavorite(itemId) ? 'fill-current' : 'fill-none'" aria-hidden="true" />
  </button>
</template>
