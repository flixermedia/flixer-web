import { openModal } from '@kolirt/vue-modal'
import ConfirmModal from '../components/ui/ConfirmModal.vue'

export interface ConfirmOptions {
  title?: string
  confirmLabel?: string
  danger?: boolean
}

/** Modal replacement for window.confirm; resolves true only when confirmed. */
export async function confirmAction(message: string, options: ConfirmOptions = {}): Promise<boolean> {
  const result = await openModal<boolean>(ConfirmModal, { props: { message, ...options } }).catch(() => false)
  return result === true
}
