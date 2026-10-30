<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useParty } from '../../composables/useParty'
import { useProfile } from '../../composables/useProfile'
import UserAvatar from '../ui/UserAvatar.vue'

const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
const party = useParty()
const { profile } = useProfile()
const draft = ref('')
const list = ref<HTMLElement | null>(null)
const input = ref<HTMLInputElement | null>(null)

function scrollToEnd() {
  void nextTick(() => {
    if (list.value) list.value.scrollTop = list.value.scrollHeight
  })
}

function submit() {
  party.sendChat(draft.value)
  draft.value = ''
}

function time(at: number) {
  return new Date(at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

watch(() => party.messages.value.length, scrollToEnd, { immediate: true })
watch(input, (el) => el?.focus(), { once: true })
</script>

<template>
  <section class="flex size-full flex-col" :aria-label="t('party.chat')">
    <header class="flex items-center justify-between px-3 pb-1 pt-2">
      <h2 class="text-xs font-semibold uppercase tracking-wide text-flixer-muted">{{ t('party.chat') }}</h2>
      <button type="button" class="grid size-7 place-items-center rounded-lg text-flixer-muted transition hover:bg-white/10 hover:text-white" :aria-label="t('party.chatClose')" @click="emit('close')">
        <Icon icon="lucide:x" class="size-4" aria-hidden="true" />
      </button>
    </header>

    <ol ref="list" class="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-2" aria-live="polite">
      <li v-if="party.messages.value.length === 0" class="py-6 text-center text-sm text-flixer-muted">{{ t('party.chatEmpty') }}</li>
      <li v-for="message in party.messages.value" :key="message.id" class="flex gap-2">
        <span class="mt-0.5 block size-6 shrink-0 overflow-hidden rounded"><UserAvatar :avatar-url="message.from.avatarUrl" :name="message.from.displayName" class="text-[10px]" /></span>
        <div class="min-w-0">
          <p class="truncate text-xs">
            <span class="font-semibold" :class="message.from.id === profile?.id ? 'text-flixer-accent' : 'text-flixer-text'">{{ message.from.displayName }}</span>
            <span class="ml-1.5 text-flixer-muted">{{ time(message.at) }}</span>
          </p>
          <p class="whitespace-pre-wrap break-words text-sm text-flixer-text">{{ message.text }}</p>
        </div>
      </li>
    </ol>

    <form class="flex gap-2 border-t border-flixer-border p-2" @submit.prevent="submit">
      <input ref="input" v-model="draft" type="text" maxlength="500" autocomplete="off" class="min-w-0 flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm text-flixer-text placeholder:text-flixer-muted focus:outline-2 focus:outline-flixer-accent" :placeholder="t('party.chatPlaceholder')" :aria-label="t('party.chatPlaceholder')" />
      <button type="submit" class="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-black transition hover:bg-white/85 disabled:opacity-40" :disabled="!draft.trim()">{{ t('party.chatSend') }}</button>
    </form>
  </section>
</template>
