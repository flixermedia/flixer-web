import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import { fetchSetupGate, type SetupGate } from './setupApi'

const COMPLETED_HINT_KEY = 'flixer.setupCompleted'

// Only trusted for the current page load. The stored hint is used solely when offline, never to skip the check online,
// so a server that was recreated from scratch still shows setup.
let confirmedReady = false
let last: SetupGate | null = null

let prefetched: Promise<SetupGate> | null = null
let verifying: Promise<void> | null = null
let onSetupRequired: (() => void) | null = null

/** The router registers how to leave the app when a background check finds the server needs setup. */
export function setSetupRequiredHandler(handler: () => void): void {
  onSetupRequired = handler
}

/** Starts the status request early so it overlaps with other startup work; the guard still waits for the answer. */
export function prefetchSetupGate(): void {
  prefetched ??= fetchSetupGate()
}

export function lastGate(): SetupGate | null {
  return last
}

export function markSetupComplete(): void {
  confirmedReady = true
  localStorage.setItem(COMPLETED_HINT_KEY, '1')
}

export function resetSetupGate(): void {
  confirmedReady = false
  last = null
  localStorage.removeItem(COMPLETED_HINT_KEY)
}

/** Router guard. Setup is only demanded when the server clearly says so; failing to find out is "unavailable", never "setup required". */
export async function setupGuard(to: RouteLocationNormalized): Promise<true | RouteLocationRaw> {
  if (to.name === 'unavailable') return true
  if (confirmedReady && to.name !== 'setup') return true

  // A previously completed install renders straight away; the server is still asked, and a reset server is sent to setup as soon as it answers.
  if (to.name !== 'setup' && navigator.onLine && localStorage.getItem(COMPLETED_HINT_KEY) === '1') {
    verifyInBackground()
    return true
  }

  const pending = prefetched ?? fetchSetupGate()
  prefetched = null
  const gate = await pending
  last = gate
  if (gate.kind === 'ready') {
    markSetupComplete()
    return to.name === 'setup' ? { name: 'home' } : true
  }
  if (gate.kind === 'setup') {
    confirmedReady = false
    localStorage.removeItem(COMPLETED_HINT_KEY)
    // Once setup has begun, signing in stays possible so a wizard interrupted after the administrator was created can be
    // resumed. On a brand-new install there is no account to sign in with, so everything goes to the wizard.
    const signInAllowed = to.name === 'login' && gate.status.state !== 'not_started'
    return to.name === 'setup' || signInAllowed ? true : { name: 'setup' }
  }
  // Offline PWA: the app shell is cached and the server cannot be asked, so keep working as before.
  if (!navigator.onLine && localStorage.getItem(COMPLETED_HINT_KEY) === '1') return true
  return { name: 'unavailable', query: { redirect: to.fullPath } }
}

function verifyInBackground(): void {
  if (verifying) return
  const pending = prefetched ?? fetchSetupGate()
  prefetched = null
  verifying = pending
    .then((gate) => {
      last = gate
      if (gate.kind === 'ready') {
        markSetupComplete()
      } else if (gate.kind === 'setup') {
        confirmedReady = false
        localStorage.removeItem(COMPLETED_HINT_KEY)
        onSetupRequired?.()
      }
    })
    .finally(() => {
      verifying = null
    })
}
