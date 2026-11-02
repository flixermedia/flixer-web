import { ModalClosedError, openModal } from '@kolirt/vue-modal'
import ConfirmModal from '../components/ui/ConfirmModal.vue'

export interface ConfirmOptions {
  title?: string
  confirmLabel?: string
  danger?: boolean
}

/** Modal replacement for window.confirm; resolves true only when confirmed. */
export async function confirmAction(message: string, options: ConfirmOptions = {}): Promise<boolean> {
  try {
    const result = await openModal<boolean>(ConfirmModal, { group: 'default', props: { message, ...options } })
    return result === true
  } catch (error) {
    if (error instanceof ModalClosedError) return false
    console.error('[confirm] Could not open confirmation modal', error)
    return false
  }
}
