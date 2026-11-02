import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  openModal: vi.fn(),
}))

vi.mock('@kolirt/vue-modal', () => ({
  ModalClosedError: class ModalClosedError extends Error {},
  openModal: mocks.openModal,
}))

vi.mock('../components/ui/ConfirmModal.vue', () => ({ default: {} }))

import { ModalClosedError } from '@kolirt/vue-modal'
import { confirmAction } from './confirm.ts'

describe('confirmAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('opens confirmation dialogs in the registered default group', async () => {
    mocks.openModal.mockResolvedValue(true)

    expect(await confirmAction('Continue?', { danger: true })).toBe(true)
    expect(mocks.openModal).toHaveBeenCalledWith({}, { group: 'default', props: { message: 'Continue?', danger: true } })
  })

  it('returns false when the confirmation dialog is dismissed', async () => {
    mocks.openModal.mockRejectedValue(new ModalClosedError())

    expect(await confirmAction('Continue?')).toBe(false)
  })

  it('logs unexpected modal errors instead of hiding them', async () => {
    const error = new Error('Modal target unavailable')
    mocks.openModal.mockRejectedValue(error)
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(await confirmAction('Continue?')).toBe(false)
    expect(log).toHaveBeenCalledWith('[confirm] Could not open confirmation modal', error)
  })
})
