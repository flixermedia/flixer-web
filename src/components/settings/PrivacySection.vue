<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getMySocialProfile, updateMySocialProfile } from '../../api'
import { notify } from '../../composables/notify'

const { t } = useI18n()
const hidden = ref(false)
const ready = ref(false)
const saving = ref(false)

getMySocialProfile()
  .then((profile) => {
    hidden.value = profile.hidden
    ready.value = true
  })
  .catch(() => notify.error(t('social.privacyLoadError')))

async function change(event: Event) {
  const next = (event.target as HTMLInputElement).checked
  const previous = hidden.value
  hidden.value = next
  saving.value = true
  try {
    hidden.value = (await updateMySocialProfile({ hidden: next })).hidden
  } catch {
    hidden.value = previous
    notify.error(t('social.saveError'))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section aria-labelledby="privacy-heading">
    <h2 id="privacy-heading" class="text-lg font-semibold">{{ t('social.privacyTitle') }}</h2>
    <p class="mt-1 text-sm text-flixer-muted">{{ t('social.privacyDescription') }}</p>
    <label class="mt-5 flex cursor-pointer items-start gap-3 text-sm text-white" :class="{ 'opacity-60': !ready }">
      <input type="checkbox" class="peer sr-only" :checked="hidden" :disabled="!ready || saving" @change="change" />
      <span class="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-white/20 transition peer-checked:bg-flixer-accent peer-focus-visible:ring-2 peer-focus-visible:ring-white after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" aria-hidden="true" />
      <span
        ><span class="block font-medium">{{ t('social.hideProfile') }}</span
        ><span class="mt-1 block text-xs text-flixer-muted">{{ t('social.hideProfileHint') }}</span></span
      >
    </label>
  </section>
</template>
