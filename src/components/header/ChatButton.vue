<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { computed } from 'vue'
import { useChatUnread } from '../../composables/useChat'
import { useMailSummary } from '../../composables/useMailSummary'

defineProps<{ buttonClass: string }>()

const { t } = useI18n()
const chat = useChatUnread()
const { info: mailInfo } = useMailSummary()
const total = computed(() => chat.unread.value + (mailInfo.value?.enabled ? mailInfo.value.unread : 0))

onMounted(chat.start)
onBeforeUnmount(chat.stop)
</script>

<template>
  <RouterLink to="/chat" :class="buttonClass" :aria-label="total ? t('chat.unreadLabel', { count: total }) : t('chat.title')" :title="t('chat.title')">
    <Icon icon="lucide:message-circle" class="size-5" aria-hidden="true" />
    <span v-if="total" class="absolute right-1 top-1 grid min-w-4 place-items-center rounded bg-flixer-accent px-1 text-[10px] font-bold leading-4 text-flixer-background">{{ total > 99 ? '99+' : total }}</span>
  </RouterLink>
</template>
