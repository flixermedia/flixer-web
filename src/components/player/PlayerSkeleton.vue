<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="relative size-full overflow-hidden bg-black" role="status" :aria-label="t('player.buffering')">
    <div class="absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-white/[0.03]"></div>

    <div class="absolute inset-x-0 top-0 flex items-center gap-3 bg-gradient-to-b from-black/80 to-transparent px-4 pb-10 pt-4 sm:px-6">
      <div class="size-10 animate-pulse rounded bg-white/10 motion-reduce:animate-none"></div>
      <div class="h-5 w-40 max-w-[55vw] animate-pulse rounded bg-white/10 motion-reduce:animate-none"></div>
    </div>

    <div class="absolute inset-0 grid place-items-center">
      <div class="size-16 animate-pulse rounded-full bg-white/10 motion-reduce:animate-none sm:size-20"></div>
    </div>

    <div class="absolute bottom-28 right-4 flex h-10 w-36 animate-pulse items-center justify-between rounded-lg border border-white/15 bg-white/10 px-4 motion-reduce:animate-none sm:right-8">
      <div class="h-3 w-16 rounded bg-white/15"></div>
      <div class="h-4 w-3 rounded bg-white/20"></div>
    </div>

    <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-3 pb-3 pt-16 sm:px-6 sm:pb-4">
      <div class="flex h-6 items-center">
        <div class="relative h-1 w-full overflow-hidden rounded bg-white/20">
          <div class="h-full w-1/4 animate-pulse rounded bg-white/35 motion-reduce:animate-none"></div>
        </div>
      </div>

      <div class="mt-1 flex items-center gap-1 sm:gap-2">
        <div class="size-10 shrink-0 animate-pulse rounded bg-white/10 motion-reduce:animate-none"></div>
        <div class="size-10 shrink-0 animate-pulse rounded bg-white/10 motion-reduce:animate-none"></div>
        <div class="size-10 shrink-0 animate-pulse rounded bg-white/10 motion-reduce:animate-none"></div>
        <div class="size-10 shrink-0 animate-pulse rounded bg-white/10 motion-reduce:animate-none"></div>
        <div class="ml-2 hidden h-3 w-24 animate-pulse rounded bg-white/10 motion-reduce:animate-none sm:block"></div>
        <div class="flex-1"></div>
        <div class="hidden h-5 w-10 animate-pulse rounded bg-white/10 motion-reduce:animate-none sm:block"></div>
        <div class="size-10 shrink-0 animate-pulse rounded bg-white/10 motion-reduce:animate-none"></div>
        <div class="size-10 shrink-0 animate-pulse rounded bg-white/10 motion-reduce:animate-none"></div>
        <div class="size-10 shrink-0 animate-pulse rounded bg-white/10 motion-reduce:animate-none"></div>
        <div class="size-10 shrink-0 animate-pulse rounded bg-white/10 motion-reduce:animate-none"></div>
        <div class="size-10 shrink-0 animate-pulse rounded bg-white/10 motion-reduce:animate-none"></div>
      </div>
    </div>
  </div>
</template>
