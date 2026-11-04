<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import type * as Monaco from 'monaco-editor/editor/editor.api'

const props = withDefaults(defineProps<{ modelValue: string; language?: 'html' | 'plaintext'; label: string; height?: string }>(), { language: 'html', height: '20rem' })
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const host = ref<HTMLElement | null>(null)
const loading = ref(true)
const editor = shallowRef<Monaco.editor.IStandaloneCodeEditor | null>(null)
let monaco: typeof Monaco | null = null
let applying = false

async function loadMonaco() {
  // Only the core editor, the HTML tokenizer and the base worker are bundled; the heavy language services are skipped.
  const [api, , worker] = await Promise.all([
    import('monaco-editor/editor/editor.api'),
    import('monaco-editor/languages/definitions/html/register'),
    import('monaco-editor/editor/editor.worker?worker'),
  ])
  const globalScope = self as unknown as { MonacoEnvironment?: { getWorker: () => Worker } }
  globalScope.MonacoEnvironment ??= { getWorker: () => new worker.default() }
  return api
}

function defineTheme(api: typeof Monaco) {
  api.editor.defineTheme('flixer', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: { 'editor.background': '#111318', 'editor.lineHighlightBackground': '#ffffff08', 'editorLineNumber.foreground': '#5b596b', 'editorCursor.foreground': '#a789ff' },
  })
}

onMounted(async () => {
  monaco = await loadMonaco()
  if (!host.value) return
  defineTheme(monaco)
  const instance = monaco.editor.create(host.value, {
    value: props.modelValue,
    language: props.language,
    theme: 'flixer',
    automaticLayout: true,
    minimap: { enabled: false },
    wordWrap: 'on',
    fontSize: 13,
    lineHeight: 20,
    scrollBeyondLastLine: false,
    tabSize: 2,
    padding: { top: 10, bottom: 10 },
    ariaLabel: props.label,
    fixedOverflowWidgets: true,
    renderLineHighlight: 'line',
  })
  instance.onDidChangeModelContent(() => {
    if (applying) return
    emit('update:modelValue', instance.getValue())
  })
  editor.value = instance
  loading.value = false
})

watch(() => props.modelValue, (value) => {
  const instance = editor.value
  if (!instance || instance.getValue() === value) return
  applying = true
  instance.setValue(value)
  applying = false
})

watch(() => props.language, (language) => {
  const model = editor.value?.getModel()
  if (model && monaco) monaco.editor.setModelLanguage(model, language)
})

onBeforeUnmount(() => {
  editor.value?.getModel()?.dispose()
  editor.value?.dispose()
})

defineExpose({
  insert(value: string) {
    const instance = editor.value
    if (!instance) return false
    const selection = instance.getSelection()
    if (!selection) return false
    instance.executeEdits('insert-variable', [{ range: selection, text: value, forceMoveMarkers: true }])
    instance.focus()
    return true
  },
})
</script>

<template>
  <div class="relative mt-2 overflow-hidden rounded border border-flixer-border bg-[#111318] focus-within:border-flixer-accent" :style="{ height }">
    <div ref="host" class="size-full" role="group" :aria-label="label"></div>
    <p v-if="loading" class="absolute inset-0 grid place-items-center text-xs text-flixer-muted">…</p>
  </div>
</template>
