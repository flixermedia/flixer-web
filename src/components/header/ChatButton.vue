<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { useChatUnread } from '../../composables/useChat'

defineProps<{ buttonClass: string }>()

const { t } = useI18n()
const chat = useChatUnread()

onMounted(chat.start)
onBeforeUnmount(chat.stop)
</script>

<template>
  <RouterLink to="/chat" :class="buttonClass" :aria-label="chat.unread.value ? t('chat.unreadLabel', { count: chat.unread.value }) : t('chat.title')" :title="t('chat.title')">
    <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
    </svg>
    <span v-if="chat.unread.value" class="absolute right-1 top-1 grid min-w-4 place-items-center rounded bg-flixer-accent px-1 text-[10px] font-bold leading-4 text-flixer-background">{{ chat.unread.value > 99 ? '99+' : chat.unread.value }}</span>
  </RouterLink>
</template>
