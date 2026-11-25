import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'
import { describePlaybackError } from './playbackError'

function makeAxiosError(status?: number, data?: Record<string, unknown>, code?: string) {
  const err = new AxiosError('Request failed', code)
  if (status !== undefined) {
    err.response = {
      status,
      statusText: 'Error',
      headers: new AxiosHeaders(),
      config: { headers: new AxiosHeaders() },
      data,
    }
  }
  return err
}

describe('describePlaybackError', () => {
  it('distinguishes streamer unreachable from server unreachable on network errors', () => {
    const streamErr = describePlaybackError(makeAxiosError(undefined, undefined, 'ERR_NETWORK'), 'stream-info')
    expect(streamErr.message).toContain('flixer-streamer')

    const apiErr = describePlaybackError(makeAxiosError(undefined, undefined, 'ERR_NETWORK'), 'playback-info')
    expect(apiErr.message).toContain('Flixer server')
  })

  it('reports media permission denied when streamer returns 403 media_permission_denied', () => {
    const details = describePlaybackError(makeAxiosError(403, { error: 'media_permission_denied' }), 'stream-info')
    expect(details.message).toContain('permission')
  })

  it('reports missing media file on 404 media_not_found', () => {
    const details = describePlaybackError(makeAxiosError(404, { error: 'media_not_found' }), 'stream-info')
    expect(details.message).toContain('could not be found')
  })

  it('reports transcoder busy on 503 transcoder_busy', () => {
    const details = describePlaybackError(makeAxiosError(503, { error: 'transcoder_busy' }), 'stream-info')
    expect(details.title).toContain('Busy')
    expect(details.message).toContain('Too many active transcodes')
  })

  it('reports ffmpeg unavailable on 501 transcoding_unavailable', () => {
    const details = describePlaybackError(makeAxiosError(501, { error: 'transcoding_unavailable' }), 'stream-info')
    expect(details.message).toContain('ffmpeg')
  })

  it('reports corrupt or unreadable media on 500 stream_failed', () => {
    const details = describePlaybackError(makeAxiosError(500, { error: 'stream_failed' }), 'stream-info')
    expect(details.message).toContain('inspect or read')
  })

  it('handles expired stream token on 401', () => {
    const details = describePlaybackError(makeAxiosError(401, { error: 'invalid_token' }), 'stream-info')
    expect(details.message).toContain('expired')
  })
})
