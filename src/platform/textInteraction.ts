import { Capacitor } from '@capacitor/core'
import { catchError } from '../utils/catchError'

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
      const [importError, module] = await catchError(import('@capgo/capacitor-textinteraction'))
      if (importError) {
        console.warn('[text-interaction] Could not update native text interaction', importError)
        return
      }
      const { TextInteraction } = module
      while (nativeEnabled !== editorFocused) {
        const enabled = editorFocused
        const [error, result] = await catchError(TextInteraction.toggle({ enabled }))
        if (error) {
          console.warn('[text-interaction] Could not update native text interaction', error)
          return
        }
        if (!result.success) return
        nativeEnabled = enabled
      }
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
