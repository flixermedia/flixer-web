import { Capacitor } from '@capacitor/core'

const editableSelector = 'input, textarea, select, [contenteditable="true"], [contenteditable=""], [role="textbox"]'

export function initNativeTextInteraction() {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') return

  let editorFocused = false
  let nativeEnabled: boolean | null = null
  let updating = false

  async function syncNativeState() {
    if (updating) return
    updating = true
    try {
      const { TextInteraction } = await import('@capgo/capacitor-textinteraction')
      while (nativeEnabled !== editorFocused) {
        const enabled = editorFocused
        const result = await TextInteraction.toggle({ enabled })
        if (!result.success) return
        nativeEnabled = enabled
      }
    } catch (error) {
      console.warn('[text-interaction] Could not update native text interaction', error)
    } finally {
      updating = false
    }
  }

  function isEditable(target: EventTarget | null): boolean {
    return target instanceof Element && target.closest(editableSelector) !== null
  }

  function setEditorFocused(focused: boolean) {
    if (editorFocused === focused) return
    editorFocused = focused
    void syncNativeState()
  }

  document.addEventListener(
    'pointerdown',
    (event) => {
      if (isEditable(event.target)) setEditorFocused(true)
    },
    true,
  )
  document.addEventListener(
    'focusin',
    (event) => {
      if (isEditable(event.target)) setEditorFocused(true)
    },
    true,
  )
  document.addEventListener(
    'focusout',
    () => {
      window.setTimeout(() => setEditorFocused(isEditable(document.activeElement)), 0)
    },
    true,
  )

  setEditorFocused(false)
}
