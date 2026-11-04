<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import Skeleton from '../ui/Skeleton.vue'
import { useMailbox } from '../../composables/useMailbox'

const { t } = useI18n()
const mail = useMailbox()

function shortDate(value: string) {
  const date = new Date(value)
  const sameDay = date.toDateString() === new Date().toDateString()
  return sameDay ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : date.toLocaleDateString([], { day: 'numeric', month: 'short' })
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <div class="flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
      <label class="flex min-w-0 flex-1 items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm text-flixer-text focus-within:ring-1 focus-within:ring-flixer-accent">
        <Icon icon="lucide:search" class="size-4 shrink-0 text-flixer-muted" aria-hidden="true" />
        <input :value="mail.search.value" type="search" class="min-w-0 flex-1 bg-transparent outline-none placeholder:text-flixer-muted" :placeholder="t('inbox.search')" @input="mail.setSearch(($event.target as HTMLInputElement).value)" />
      </label>
      <button type="button" class="grid size-9 shrink-0 place-items-center rounded-lg transition hover:bg-white/10" :class="mail.unreadOnly.value ? 'bg-white/10 text-flixer-accent' : 'text-flixer-muted'" :aria-pressed="mail.unreadOnly.value" :aria-label="t('inbox.unreadOnly')" :title="t('inbox.unreadOnly')" @click="mail.setUnreadOnly(!mail.unreadOnly.value)">
        <Icon icon="lucide:mail-warning" class="size-4" aria-hidden="true" />
      </button>
    </div>
    <p v-if="mail.error.value" class="p-4 text-sm text-red-300" role="alert">{{ mail.error.value }}</p>
    <ul v-if="mail.loading.value && !mail.messages.value.length" class="space-y-1 p-2">
      <li v-for="n in 5" :key="n" class="flex items-center gap-3 p-2"><Skeleton class="size-10 rounded" /><Skeleton class="h-4 w-32" /></li>
    </ul>
    <p v-else-if="!mail.messages.value.length" class="p-8 text-center text-sm text-flixer-muted">{{ t('inbox.empty') }}</p>
    <ul v-else class="min-h-0 flex-1 space-y-1 overflow-y-auto p-2.5">
      <li v-for="message in mail.messages.value" :key="message.id">
        <button type="button" class="flex w-full items-center gap-3 rounded border border-transparent px-2.5 py-3 text-left transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" :class="mail.selectedId.value === message.id ? 'border-white/10 bg-white/5' : ''" @click="mail.select(message.id)">
          <span class="grid size-11 shrink-0 place-items-center rounded-lg bg-white/10 text-flixer-muted" aria-hidden="true"><Icon icon="lucide:mail" class="size-5" /></span>
          <span class="min-w-0 flex-1">
            <span class="flex items-baseline justify-between gap-2">
              <span class="truncate text-sm text-white" :class="message.read ? 'font-medium' : 'font-bold'">{{ message.fromName || message.from }}</span>
              <time class="shrink-0 text-[11px] text-flixer-muted">{{ shortDate(message.createdAt) }}</time>
            </span>
            <span class="flex items-center justify-between gap-2">
              <span class="truncate text-xs" :class="message.read ? 'text-flixer-muted' : 'text-white'">{{ message.subject || t('inbox.noSubject') }}</span>
              <span v-if="!message.read" class="size-2 shrink-0 rounded-full bg-flixer-accent" aria-hidden="true"></span>
            </span>
          </span>
        </button>
      </li>
    </ul>
    <div v-if="mail.totalPages.value > 1" class="flex items-center justify-between border-t border-white/10 px-3 py-2 text-xs">
      <button type="button" class="rounded px-2 py-1 hover:bg-white/10 disabled:opacity-40" :disabled="mail.page.value <= 1" @click="mail.setPage(mail.page.value - 1)">{{ t('inbox.previous') }}</button>
      <span class="text-flixer-muted">{{ t('inbox.pageOf', { page: mail.page.value, pages: mail.totalPages.value }) }}</span>
      <button type="button" class="rounded px-2 py-1 hover:bg-white/10 disabled:opacity-40" :disabled="mail.page.value >= mail.totalPages.value" @click="mail.setPage(mail.page.value + 1)">{{ t('inbox.next') }}</button>
    </div>
  </div>
</template>
