<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { activeLineIndex, instrumentalDotCount, isInstrumentalCue, type LyricLine, type ParsedLyrics } from "../../composables/lrc";
import { createLineSpringFrames } from "../../composables/lyricMotion";

const props = defineProps<{
	lyrics: ParsedLyrics;
	currentTime: number;
	duration: number;
	paused: boolean;
}>();
const emit = defineEmits<{ seek: [time: number] }>();
const { t } = useI18n();
const scroller = ref<HTMLElement | null>(null);
const lineRefs: HTMLElement[] = [];
const playbackTime = ref(props.currentTime);
const activeIndex = computed(() => activeLineIndex(props.lyrics.lines, playbackTime.value));
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let animations: Animation[] = [];
let resizeObserver: ResizeObserver | undefined;
let playbackFrame = 0;
let playbackStamp = performance.now();
let resumeTimer: ReturnType<typeof setTimeout> | undefined;
let userScrolling = false;

function cancelAnimations() {
	for (const animation of animations) animation.cancel();
	animations = [];
}

async function slideToLine(index = Math.max(0, activeIndex.value), animate = true) {
	await nextTick();
	const box = scroller.value;
	const selected = lineRefs[index];
	if (!box || !selected || userScrolling) return;
	const previousTops = lineRefs.map((line) => line.getBoundingClientRect().top);
	cancelAnimations();
	const boxRect = box.getBoundingClientRect();
	const lineTop = box.scrollTop + selected.getBoundingClientRect().top - boxRect.top;
	box.scrollTop = Math.max(0, lineTop - box.clientHeight * 0.25);
	if (!animate || reducedMotion.matches) return;
	animations = lineRefs.flatMap((line, lineIndex) => {
		const bounds = line.getBoundingClientRect();
		const distance = previousTops[lineIndex] - bounds.top;
		if (Math.abs(distance) < 1 || bounds.bottom < boxRect.top - box.clientHeight || bounds.top > boxRect.bottom + box.clientHeight) return [];
		const animation = line.animate(createLineSpringFrames(distance, 0, 10, "translate"), {
			duration: 1200,
			delay: Math.min(Math.max(0, lineIndex - index), 6) * 28,
			fill: "both",
		});
		animation.onfinish = () => animation.cancel();
		return [animation];
	});
}

function resize() {
	const box = scroller.value;
	if (!box) return;
	box.style.setProperty("--lyrics-height", `${box.clientHeight}px`);
	void slideToLine(Math.max(0, activeIndex.value), false);
}

function suspendAutoScroll() {
	userScrolling = true;
	cancelAnimations();
	clearTimeout(resumeTimer);
	resumeTimer = setTimeout(() => {
		userScrolling = false;
		void slideToLine();
	}, 5000);
}

function onScrollKey(event: KeyboardEvent) {
	if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(event.key)) suspendAutoScroll();
}

function seekToLine(index: number) {
	const time = props.lyrics.lines[index]?.time;
	if (time === null || time === undefined || !Number.isFinite(time)) return;
	clearTimeout(resumeTimer);
	userScrolling = false;
	emit("seek", time);
	void slideToLine(index);
}

function wordFill(line: LyricLine, lineIndex: number, wordIndex: number): string {
	if (lineIndex !== activeIndex.value) return lineIndex < activeIndex.value ? "100%" : "0%";
	const word = line.words![wordIndex];
	const nextWord = line.words!.slice(wordIndex + 1).find((candidate) => candidate.time > word.time);
	const nextLine = props.lyrics.lines.slice(lineIndex + 1).find((candidate) => candidate.time !== null && candidate.time > word.time);
	const end = nextWord?.time ?? nextLine?.time ?? props.duration;
	const progress = (playbackTime.value - word.time) / Math.max(0.001, end - word.time);
	return `${Math.max(0, Math.min(1, progress)) * 100}%`;
}

function startClock() {
	cancelAnimationFrame(playbackFrame);
	playbackTime.value = props.currentTime;
	playbackStamp = performance.now();
	if (props.paused) return;
	const tick = (now: number) => {
		playbackTime.value = Math.min(props.duration || Infinity, props.currentTime + Math.min(0.75, (now - playbackStamp) / 1000));
		playbackFrame = requestAnimationFrame(tick);
	};
	playbackFrame = requestAnimationFrame(tick);
}

watch(() => props.currentTime, (time) => {
	playbackTime.value = time;
	playbackStamp = performance.now();
});
watch(() => props.paused, startClock);
watch(activeIndex, (index) => { if (index >= 0) void slideToLine(index); });
watch(() => props.lyrics, () => { void slideToLine(Math.max(0, activeIndex.value), false); });

onMounted(() => {
	resizeObserver = new ResizeObserver(resize);
	if (scroller.value) resizeObserver.observe(scroller.value);
	startClock();
	resize();
});
onBeforeUnmount(() => {
	cancelAnimationFrame(playbackFrame);
	clearTimeout(resumeTimer);
	resizeObserver?.disconnect();
	cancelAnimations();
});
</script>

<template>
	<div ref="scroller" class="synced-lyrics" @wheel.passive="suspendAutoScroll"
		@touchstart.passive="suspendAutoScroll" @keydown="onScrollKey">
		<ul class="lyric-lines">
			<li v-for="(line, index) in lyrics.lines" :key="index"
				:ref="(element) => { if (element) lineRefs[index] = element as HTMLElement; }"
				class="lyric-line" :class="{ 'is-active': index === activeIndex, 'is-past': index < activeIndex, 'is-distant': Math.abs(index - activeIndex) > 1, 'is-instrumental': isInstrumentalCue(line.text) }">
				<button type="button" class="lyric-button" :aria-current="index === activeIndex ? 'true' : undefined"
					:aria-label="isInstrumentalCue(line.text) ? t('music.instrumental') : undefined"
					:disabled="line.time === null" @click="seekToLine(index)">
					<span v-if="isInstrumentalCue(line.text)" class="instrumental-dots" aria-hidden="true">
						<span v-for="dot in 3" :key="dot" :class="{ 'is-lit': dot <= instrumentalDotCount(lyrics.lines, index, playbackTime) }" />
					</span>
					<template v-else-if="line.words?.length">
						<span v-for="(word, wordIndex) in line.words" :key="wordIndex" class="lyric-word"
							:style="{ '--word-fill': wordFill(line, index, wordIndex) }">{{ word.text }}</span>
					</template>
					<template v-else>{{ line.text }}</template>
				</button>
			</li>
		</ul>
	</div>
</template>

<style scoped>
.synced-lyrics {
	position: relative;
	height: 100%;
	min-height: 0;
	min-width: 0;
	overflow-x: hidden;
	overflow-y: auto;
	overscroll-behavior: contain;
	overflow-anchor: none;
	scrollbar-width: none;
	mask-image: linear-gradient(to bottom, transparent, black 10%, black 85%, transparent);
}

.lyric-lines {
	list-style: none;
	margin: 0;
	padding: calc(var(--lyrics-height, 400px) * 0.25) 12px calc(var(--lyrics-height, 400px) * 0.75);
}

.lyric-line {
	position: relative;
	margin-bottom: 25px;
}

.lyric-button {
	display: block;
	width: 100%;
	padding: 4px 8px;
	border-radius: 8px;
	background: transparent;
	color: rgb(255 255 255 / 45%);
	font-size: 28px;
	font-weight: 700;
	line-height: 1.2;
	letter-spacing: 0;
	text-align: left;
	overflow-wrap: anywhere;
	white-space: pre-wrap;
	cursor: pointer;
	transform: scale(0.98);
	transform-origin: left center;
	filter: blur(0.7px);
	transition: color 700ms ease, filter 700ms ease, transform 450ms ease, text-shadow 450ms ease;
}

.is-distant .lyric-button { filter: blur(1.8px); }
.is-past .lyric-button { color: rgb(255 255 255 / 30%); }
.is-active .lyric-button {
	color: white;
	filter: none;
	transform: scale(1);
	text-shadow: 0 0 14px rgb(255 255 255 / 15%);
}
.lyric-button:hover, .lyric-button:focus-visible { color: white; filter: none; }
.lyric-button:focus-visible { outline: 2px solid white; outline-offset: 3px; }
.is-active .lyric-word {
	color: transparent;
	background: linear-gradient(to right, #fff var(--word-fill), rgb(255 255 255 / 40%) var(--word-fill));
	background-clip: text;
	-webkit-background-clip: text;
}
.instrumental-dots { display: inline-flex; height: 34px; align-items: center; gap: 8px; }
.instrumental-dots span { width: 10px; height: 10px; border-radius: 50%; background: white; opacity: 0.25; transition: opacity 400ms ease, transform 400ms ease; }
.instrumental-dots .is-lit { opacity: 1; transform: scale(1.15); }

@media (min-width: 768px) {
	.lyric-button { font-size: 34px; }
	.lyric-line { margin-bottom: 32px; }
}
@media (prefers-reduced-motion: reduce) {
	.lyric-button, .instrumental-dots span { transition: none; }
}
</style>