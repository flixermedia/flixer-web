import { describe, expect, it } from 'vitest'
import { requestStatusLabelKey } from './requestStatus'

describe('request status labels', () => {
  it('maps actionable request states to the card badge namespace', () => {
    expect(requestStatusLabelKey('pending')).toBe('requests.cardStatus.pending')
    expect(requestStatusLabelKey('available')).toBe('requests.cardStatus.available')
  })

  it('does not show a badge when the title has not been requested', () => {
    expect(requestStatusLabelKey('none')).toBe('')
  })
})
