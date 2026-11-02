import { Capacitor } from '@capacitor/core'
import { catchError } from '../utils/catchError'

export async function initNativeTextInteraction(): Promise<void> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') return

  const [importError, module] = await catchError(import('@capgo/capacitor-textinteraction'))
  if (importError) {
    console.warn('[text-interaction] Could not enable native text interaction', importError)
    return
  }

  const [error, result] = await catchError(module.TextInteraction.toggle({ enabled: true }))
  if (error) {
    console.warn('[text-interaction] Could not enable native text interaction', error)
    return
  }
  if (!result.success) console.error('[text-interaction] Native text interaction could not be enabled')
}
