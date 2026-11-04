<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { AUDIO_BITRATES, ORIGINAL_AUDIO_QUALITY, useAudioPlayer } from "../../composables/useAudioPlayer";

withDefaults(defineProps<{ compact?: boolean }>(), { compact: false });

const { t } = useI18n();
const player = useAudioPlayer();
</script>

<template>
	<label class="inline-flex shrink-0 items-center gap-2 text-xs font-medium text-flixer-text">
		<span :class="compact ? 'sr-only' : ''">{{ t("music.audioQuality") }}</span>
		<select :class="compact ? 'w-[5rem] rounded border border-white/15 bg-flixer-surface px-1.5 py-1.5 text-xs text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent' : 'rounded border border-white/15 bg-flixer-surface px-2 py-2 text-sm text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent'" :value="player.audioBitrate.value" :aria-label="t('music.audioQuality')" @change="player.setAudioBitrate(Number(($event.target as HTMLSelectElement).value))">
			<option :value="ORIGINAL_AUDIO_QUALITY">{{ t("music.audioOriginal") }}</option>
			<option v-for="bitrate in AUDIO_BITRATES" :key="bitrate" :value="bitrate">
				{{ compact ? `${bitrate}k` : `${bitrate} kbps` }}
			</option>
		</select>
	</label>
</template>
