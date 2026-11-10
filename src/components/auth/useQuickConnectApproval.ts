import axios from 'axios'
import { ref } from 'vue'
import { decideQuickConnect, getQuickConnectStatus } from '../../api/auth'
import { catchError } from '../../utils/catchError'

/** Manages the approval state shared by the account modal and legacy approval page. */
export function useQuickConnectApproval(initialCode: string, t: (key: string) => string) {
  const userCode = ref(initialCode.toUpperCase())
  const isEnabled = ref<boolean | null>(null)
  const isLoadingStatus = ref(true)
  const isSubmitting = ref(false)
  const decisionComplete = ref(false)
  const message = ref('')
  const messageIsError = ref(false)

  async function loadStatus() {
    const [error, status] = await catchError(getQuickConnectStatus())
    isLoadingStatus.value = false
    if (error) {
      console.error('[quick-connect] could not load availability', error)
      messageIsError.value = true
      message.value = t('auth.quickConnectStatusError')
      return
    }
    isEnabled.value = status.enabled
  }

  async function decide(decision: 'approve' | 'deny') {
    if (isEnabled.value !== true || isSubmitting.value || decisionComplete.value || !userCode.value.trim()) return
    isSubmitting.value = true
    message.value = ''
    const [error] = await catchError(decideQuickConnect(userCode.value, decision))
    isSubmitting.value = false
    if (error) {
      console.error(`[quick-connect] could not ${decision} request`, error)
      messageIsError.value = true
      const status = axios.isAxiosError(error) ? error.response?.status : undefined
      message.value = status === 400 || status === 404
        ? t('auth.quickConnectDecisionError')
        : status === 403
          ? t('auth.quickConnectDisabled')
          : status === 429
            ? t('auth.quickConnectRateLimited')
            : t('auth.quickConnectRequestError')
      return
    }
    messageIsError.value = false
    decisionComplete.value = true
    message.value = decision === 'approve' ? t('auth.quickConnectApproved') : t('auth.quickConnectDenied')
  }

  void loadStatus()
  return { userCode, isEnabled, isLoadingStatus, isSubmitting, decisionComplete, message, messageIsError, decide }
}
