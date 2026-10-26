import type { ExternalRequestStatus } from '../api'

export function requestStatusLabelKey(status: ExternalRequestStatus): string {
  return status === 'none' ? '' : `requests.cardStatus.${status}`
}
