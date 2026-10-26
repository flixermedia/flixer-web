<script setup lang="ts">
import { openModal } from '@kolirt/vue-modal'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import TextModal from './TextModal.vue'

const props = defineProps<{ text: string; title: string }>()
const { t } = useI18n()
const element = ref<HTMLElement | null>(null)
const overflowing = ref(false)

function measure() {
  const el = element.value
  overflowing.value = el !== null && el.scrollHeight > el.clientHeight + 1
}

let observer: ResizeObserver | undefined
onMounted(() => {
  measure()
  if (element.value && typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(measure)
    observer.observe(element.value)
  }
})
onBeforeUnmount(() => observer?.disconnect())
watch(
  () => props.text,
  () => void nextTick(measure),
)

function open() {
  void openModal(TextModal, { props: { title: props.title, text: props.text } }).catch(() => undefined)
}
</script>

<template>
  <div>
    <p ref="element" class="line-clamp-4 whitespace-pre-line text-base leading-relaxed text-flixer-text/90">{{ text }}</p>
    <button v-if="overflowing" type="button" class="mt-2 text-sm font-semibold text-flixer-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent" @click="open">{{ t('common.readMore') }}</button>
  </div>
</template>
