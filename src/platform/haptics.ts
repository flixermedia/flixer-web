import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { Capacitor } from '@capacitor/core'

function onDocumentClick(event: MouseEvent) {
  const target = event.target
  if (!(target instanceof Element)) return

  const control = target.closest<HTMLElement>('button:not(:disabled), a[href], [role="button"]')
  if (!control || control.getAttribute('aria-disabled') === 'true' || !control.closest('[data-haptic]')) return

  void Haptics.impact({ style: ImpactStyle.Light }).catch((error: unknown) => {
    console.warn('[haptics] button feedback failed', error)
  })
}

export function initButtonHaptics() {
  if (Capacitor.isNativePlatform()) {
    document.addEventListener('click', onDocumentClick)
  }
}
