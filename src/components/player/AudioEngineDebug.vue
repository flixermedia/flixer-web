<script setup lang="ts">
import { computed } from "vue";
import { useAudioPlayer } from "../../composables/useAudioPlayer";

const player = useAudioPlayer();
const visible = computed(() => import.meta.env.DEV && player.current.value !== null);
</script>

<template>
	<div v-if="visible && player.audioEngine.value" class="fixed right-3 top-[calc(env(safe-area-inset-top)+5.25rem)] z-[60] inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-flixer-surface/95 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg shadow-black/30 backdrop-blur" role="status" data-audio-engine-debug :aria-label="`Audio engine: ${player.audioEngine.value} audio`" :title="`${player.audioEngine.value} audio`">
		<Icon icon="lucide:globe" class="size-3.5 text-flixer-accent" aria-hidden="true" />
		<span>Web audio</span>
	</div>
</template>
