import { describe, expect, it } from 'vitest'
import { useMaintenanceMode } from './useMaintenanceMode'
import { useUpdateOverlay } from './useUpdateOverlay'

describe('useMaintenanceMode', () => {
  it('toggles maintenance state and preview flag', () => {
    const { maintenanceActive, maintenancePreview, enterMaintenance, exitMaintenance } = useMaintenanceMode()
    exitMaintenance()
    expect(maintenanceActive.value).toBe(false)

    enterMaintenance(true)
    expect(maintenanceActive.value).toBe(true)
    expect(maintenancePreview.value).toBe(true)

    exitMaintenance()
    expect(maintenanceActive.value).toBe(false)
    expect(maintenancePreview.value).toBe(false)
  })
})

describe('useUpdateOverlay', () => {
  it('opens overlay when syncing a running update and closes cleanly after completion', () => {
    const { overlayOpen, displayRun, syncRun, closeOverlay } = useUpdateOverlay()
    syncRun({
      id: 'run-1',
      status: 'running',
      step: 'pull',
      startedAt: new Date().toISOString(),
      finishedAt: null,
      targets: { flixer: '1.13.13' },
      previous: { flixer: '1.13.12' },
      backup: '',
      error: '',
    })
    expect(overlayOpen.value).toBe(true)
    // Cannot dismiss while still running.
    closeOverlay()
    expect(overlayOpen.value).toBe(true)

    syncRun({ ...displayRun.value!, status: 'succeeded', finishedAt: new Date().toISOString() })
    closeOverlay()
    expect(overlayOpen.value).toBe(false)
  })
})
