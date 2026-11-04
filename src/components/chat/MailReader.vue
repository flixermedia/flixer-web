<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMailbox } from '../../composables/useMailbox'

const { t } = useI18n()
const mail = useMailbox()
const message = computed(() => mail.active.value)

function escapeText(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char)
}
function safeHtmlDocument(html: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font:16px/1.6 system-ui,sans-serif;color:#202124;margin:20px;overflow-wrap:anywhere}img{max-width:100%;height:auto}table{max-width:100%;border-collapse:collapse}</style></head><body>${html}</body></html>`
}
const source = computed(() => (message.value?.html ? safeHtmlDocument(message.value.html) : message.value ? safeHtmlDocument(`<pre style="white-space:pre-wrap">${escapeText(message.value.text)}</pre>`) : ''))
const authChecks = computed(() => {
  const checks = message.value?.authResults ?? {}
  return ['spf', 'dkim', 'dmarc'].map((key) => ({ key, value: typeof checks[key] === 'string' ? String(checks[key]) : 'unknown' }))
})
const date = (value: string) => new Date(value).toLocaleString()
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <p v-if="mail.readerLoading.value" class="m-auto p-8 text-sm text-flixer-muted">{{ t('inbox.loadingMessage') }}</p>
    <p v-else-if="!message" class="m-auto p-6 text-center text-sm text-flixer-muted">{{ t('inbox.selectMessage') }}</p>
    <template v-else>
      <header class="border-b border-white/10 bg-flixer-background/80 px-2.5 py-3 sm:px-4">
        <div class="flex items-start gap-2 sm:gap-3">
          <button type="button" class="grid size-9 shrink-0 place-items-center rounded-lg text-white/80 transition hover:bg-white/10 lg:hidden" :aria-label="t('chat.back')" @click="mail.close()"><Icon icon="lucide:chevron-left" class="size-5" aria-hidden="true" /></button>
          <div class="min-w-0 flex-1">
            <h2 class="break-words text-base font-semibold text-white">{{ message.subject || t('inbox.noSubject') }}</h2>
            <p class="mt-0.5 truncate text-xs text-flixer-muted">{{ message.fromName ? `${message.fromName} <${message.from}>` : message.from }} · {{ date(message.createdAt) }}</p>
          </div>
          <button type="button" class="grid size-9 shrink-0 place-items-center rounded-lg text-flixer-muted transition hover:bg-red-500/10 hover:text-red-200 disabled:opacity-50" :aria-label="t('inbox.delete')" :disabled="mail.actionBusy.value" @click="mail.remove(message)"><Icon icon="lucide:trash-2" class="size-4" aria-hidden="true" /></button>
        </div>
        <details class="mt-2 text-xs text-flixer-muted sm:pl-12">
          <summary class="cursor-pointer select-none hover:text-white">{{ t('inbox.details') }}</summary>
          <dl class="mt-2 grid gap-1 sm:grid-cols-[auto_1fr]">
            <dt>{{ t('inbox.to') }}</dt><dd class="break-all text-flixer-text">{{ message.to.join(', ') }}</dd>
            <template v-if="message.messageId"><dt>{{ t('inbox.messageId') }}</dt><dd class="break-all text-flixer-text">{{ message.messageId }}</dd></template>
          </dl>
          <div class="mt-2 flex flex-wrap gap-2"><span v-for="check in authChecks" :key="check.key" class="rounded px-2 py-1 text-[11px] font-semibold" :class="check.value === 'pass' ? 'bg-emerald-500/15 text-emerald-300' : check.value === 'fail' ? 'bg-red-500/15 text-red-200' : 'bg-white/10 text-flixer-muted'">{{ check.key.toUpperCase() }} · {{ check.value }}</span></div>
        </details>
      </header>
      <div v-if="message.attachments.length" class="flex flex-wrap gap-2 border-b border-white/10 p-3">
        <button v-for="attachment in message.attachments" :key="attachment.id" type="button" class="flex items-center gap-2 rounded border border-white/10 px-3 py-2 text-xs text-flixer-text hover:bg-white/5" @click="mail.download(attachment)"><Icon icon="lucide:paperclip" class="size-3.5" aria-hidden="true" />{{ attachment.filename }}<span class="text-flixer-muted">{{ Math.max(1, Math.round(attachment.size / 1024)) }} KB</span></button>
      </div>
      <iframe v-if="message.html" :srcdoc="source" sandbox="" class="min-h-0 w-full flex-1 bg-white" :title="t('inbox.messageBody')"></iframe>
      <pre v-else class="min-h-0 flex-1 overflow-auto whitespace-pre-wrap break-words p-5 text-sm leading-6 text-flixer-text">{{ message.text }}</pre>
    </template>
  </div>
</template>
