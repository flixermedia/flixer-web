<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AVATAR_TYPES, MAX_AVATAR_BYTES, removeAvatar, uploadAvatar } from '../../api'
import { notify } from '../../composables/notify'
import { describeRequestError, useProfile } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import UserAvatar from '../ui/UserAvatar.vue'

const { profile, setProfile } = useProfile()
const { t } = useI18n()
const fileInput = ref<HTMLInputElement | null>(null)
const isBusy = ref(false)

async function handleFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) {
    return
  }
  if (!AVATAR_TYPES.includes(file.type)) {
    notify.error(t('settings.avatar.invalidType'))
    return
  }
  if (file.size > MAX_AVATAR_BYTES) {
    notify.error(t('settings.avatar.tooLarge'))
    return
  }

  isBusy.value = true
  try {
    const [error, profile] = await catchError(uploadAvatar(file))
    if (error) {
      console.error('[settings] avatar upload failed', error)
      notify.error(describeRequestError(error, t('settings.avatar.uploadFailed')))
    } else {
      setProfile(profile)
      notify.success(t('settings.avatar.updated'))
    }
  } finally {
    isBusy.value = false
  }
}

async function handleRemove() {
  isBusy.value = true
  try {
    const [error, profile] = await catchError(removeAvatar())
    if (error) {
      console.error('[settings] avatar removal failed', error)
      notify.error(describeRequestError(error, t('settings.avatar.removeFailed')))
    } else {
      setProfile(profile)
      notify.success(t('settings.avatar.removed'))
    }
  } finally {
    isBusy.value = false
  }
}
</script>

<template>
  <div class="flex items-center gap-5">
    <button type="button" class="group relative size-20 shrink-0 overflow-hidden rounded-xl text-3xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-wait" :aria-label="t('settings.avatar.changeLabel')" :disabled="isBusy" @click="fileInput?.click()">
      <UserAvatar :avatar-url="profile?.avatarUrl" :name="profile?.displayName" />
      <span class="absolute inset-0 grid place-items-center bg-black/55 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">{{ isBusy ? t('settings.avatar.working') : t('settings.avatar.change') }}</span>
    </button>

    <div class="flex flex-col gap-2">
      <div class="flex flex-wrap gap-2">
        <button type="button" class="flex h-10 items-center justify-center rounded-lg border border-flixer-border px-4 text-sm font-semibold text-flixer-text transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:cursor-wait disabled:opacity-60" :disabled="isBusy" @click="fileInput?.click()">
          {{ profile?.avatarUrl ? t('settings.avatar.changePicture') : t('settings.avatar.uploadPicture') }}
        </button>
        <button v-if="profile?.avatarUrl" type="button" class="flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold text-rose-200 transition hover:bg-rose-400/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300 disabled:cursor-wait disabled:opacity-60" :disabled="isBusy" @click="handleRemove">{{ t('settings.avatar.remove') }}</button>
      </div>
      <p class="text-xs text-flixer-muted">{{ t('settings.avatar.fileRequirements') }}</p>
    </div>

    <input ref="fileInput" type="file" class="hidden" accept="image/png,image/jpeg,image/webp,image/gif" @change="handleFile" />
  </div>
</template>
