<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { listSettings, type ServerSetting } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import { applyWidevinePlaybackSettings, configureWidevinePlayer, createShakaPlayer, destroyShakaPlayer, isShakaSupported } from '../player/adaptivePlayback'
import AdminSection from './AdminSection.vue'
import AdminSkeleton from './AdminSkeleton.vue'

const { t } = useI18n()
const manifestUrl = ref('')
const isLoading = ref(true)
const isEnabled = ref(false)
const licenseServerUrl = ref('')
const browserSupported = ref(false)
const secureContext = ref(false)
const result = ref<'idle' | 'testing' | 'widevine' | 'clear' | 'error'>('idle')
const video = ref<HTMLVideoElement | null>(null)
let player: ReturnType<typeof createShakaPlayer> | null = null

const canTest = computed(() => !isLoading.value && browserSupported.value && secureContext.value && isEnabled.value && Boolean(licenseServerUrl.value))

async function loadSettings() {
	const [error, settings] = await catchError(listSettings())
	isLoading.value = false
	if (error) {
		console.error('[drm-testing] failed to load settings', error)
		notify.error(describeRequestError(error, t('admin.drm.testing.loadError')))
		return
	}
	const value = (key: string) => settings.find((setting: ServerSetting) => setting.key === key)?.value
	const enabled = value('widevine_drm_enabled')
	const url = value('widevine_license_server_url')
	if (typeof enabled !== 'boolean' || typeof url !== 'string') {
		console.error('[drm-testing] settings are missing or invalid')
		notify.error(t('admin.drm.testing.loadError'))
		return
	}
	isEnabled.value = enabled
	licenseServerUrl.value = url
	applyWidevinePlaybackSettings(enabled, url)
}

async function stopPlayer() {
	const current = player
	player = null
	if (current) await destroyShakaPlayer(current)
}

async function testPlayback() {
	const url = manifestUrl.value.trim()
	let parsedUrl: URL
	try {
		parsedUrl = new URL(url)
	} catch {
		notify.error(t('admin.drm.testing.invalidManifest'))
		return
	}
	if (parsedUrl.protocol !== 'https:') {
		notify.error(t('admin.drm.testing.httpsRequired'))
		return
	}
	if (!canTest.value || !video.value) return

	result.value = 'testing'
	try {
		await stopPlayer()
		player = createShakaPlayer(video.value)
		await configureWidevinePlayer(player)
		await player.load(parsedUrl.toString())
		result.value = player.drmInfo()?.keySystem === 'com.widevine.alpha' ? 'widevine' : 'clear'
	} catch (error) {
		console.error('[drm-testing] playback test failed', error)
		result.value = 'error'
		await stopPlayer()
	}
}

onMounted(async () => {
	secureContext.value = window.isSecureContext
	browserSupported.value = isShakaSupported()
	await loadSettings()
})

onBeforeUnmount(() => {
	void stopPlayer().catch((error: unknown) => console.warn('[drm-testing] could not stop test player', error))
})
</script>

<template>
	<div class="flex flex-col gap-6">
		<AdminSection :title="t('admin.drm.testing.title')" :description="t('admin.drm.testing.description')">
			<AdminSkeleton v-if="isLoading" variant="fields" :rows="2" />
			<div v-else class="max-w-3xl space-y-4">
				<ul class="space-y-2 text-sm text-flixer-muted">
					<li>{{ t('admin.drm.testing.secureContext', { status: secureContext ? t('admin.drm.testing.available') : t('admin.drm.testing.unavailable') }) }}</li>
					<li>{{ t('admin.drm.testing.browserSupport', { status: browserSupported ? t('admin.drm.testing.available') : t('admin.drm.testing.unavailable') }) }}</li>
					<li>{{ t('admin.drm.testing.configuration', { status: isEnabled && licenseServerUrl ? t('admin.drm.testing.available') : t('admin.drm.testing.unavailable') }) }}</li>
				</ul>

				<p v-if="!secureContext || !browserSupported || !isEnabled || !licenseServerUrl" class="rounded border border-flixer-border bg-flixer-background/50 p-3 text-sm text-flixer-muted" role="status">
					{{ t('admin.drm.testing.notReady') }}
				</p>

				<label class="block text-xs text-flixer-muted">
					{{ t('admin.drm.testing.manifestUrl') }}
					<input v-model="manifestUrl" type="url" maxlength="2048" autocomplete="url" spellcheck="false" class="mt-1 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 font-mono text-sm text-flixer-text" :placeholder="t('admin.drm.testing.manifestPlaceholder')" />
				</label>

				<button type="button" class="rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-60" :disabled="!canTest || result === 'testing' || !manifestUrl.trim()" @click="testPlayback">
					{{ result === 'testing' ? t('admin.drm.testing.testing') : t('admin.drm.testing.startTest') }}
				</button>

				<p v-if="result !== 'idle' && result !== 'testing'" class="text-sm" :class="result === 'error' ? 'text-red-300' : 'text-flixer-muted'" role="status">
					{{ t(`admin.drm.testing.result.${result}`) }}
				</p>

				<video ref="video" v-show="result === 'widevine' || result === 'clear'" class="aspect-video w-full rounded bg-black" controls playsinline />
			</div>
		</AdminSection>
	</div>
</template>
