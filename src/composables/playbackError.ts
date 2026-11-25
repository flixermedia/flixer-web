import axios from 'axios'
import { i18n } from '../i18n'

export type PlaybackErrorStage = 'playback-info' | 'stream-info'

export interface PlaybackErrorDetails {
  title: string
  message: string
}

interface ErrorPayload {
  error?: string
  name?: string
  message?: string
}

/** Maps API and flixer-streamer errors into actionable, user-facing playback error messages. */
export function describePlaybackError(error: unknown, stage: PlaybackErrorStage): PlaybackErrorDetails {
  const t = i18n.global.t

  if (axios.isAxiosError<ErrorPayload>(error)) {
    const status = error.response?.status
    const code = error.response?.data?.error
    const serverMessage = error.response?.data?.message?.trim()

    if (!error.response || error.code === 'ECONNABORTED') {
      return stage === 'stream-info'
        ? { title: t('player.error.streamerUnreachableTitle'), message: t('player.error.streamerUnreachable') }
        : { title: t('player.error.serverUnreachableTitle'), message: t('player.error.serverUnreachable') }
    }

    if (code === 'transcoder_busy') {
      return { title: t('player.error.transcoderBusyTitle'), message: t('player.error.transcoderBusy') }
    }

    if (status === 502 || status === 503 || status === 504) {
      if (stage === 'stream-info' || /streamer/i.test(serverMessage ?? '')) {
        return { title: t('player.error.streamerUnreachableTitle'), message: t('player.error.streamerUnreachable') }
      }
      return { title: t('player.error.serverUnavailableTitle'), message: serverMessage || t('player.error.serverUnavailable') }
    }

    if (status === 401 || code === 'invalid_token') {
      return stage === 'stream-info'
        ? { title: t('player.error.streamExpiredTitle'), message: t('player.error.streamExpired') }
        : { title: t('player.error.unauthorizedTitle'), message: t('player.error.unauthorized') }
    }

    if (status === 403) {
      if (code === 'media_permission_denied') {
        return { title: t('player.error.permissionDeniedTitle'), message: t('player.error.mediaPermissionDenied') }
      }
      if (code === 'original_not_permitted') {
        return { title: t('player.error.forbiddenTitle'), message: t('player.error.originalNotPermitted') }
      }
      return { title: t('player.error.forbiddenTitle'), message: serverMessage || t('player.error.forbidden') }
    }

    if (status === 404 || code === 'media_not_found') {
      return { title: t('player.error.mediaNotFoundTitle'), message: t('player.error.mediaNotFound') }
    }

    if (status === 501 || code === 'transcoding_unavailable') {
      return { title: t('player.error.transcodingUnavailableTitle'), message: t('player.error.transcodingUnavailable') }
    }

    if (status === 400 || code === 'invalid_options') {
      return { title: t('player.error.invalidOptionsTitle'), message: serverMessage || t('player.error.invalidOptions') }
    }

    if (code === 'stream_failed' || (status !== undefined && status >= 500 && stage === 'stream-info')) {
      return { title: t('player.error.streamFailedTitle'), message: t('player.error.streamFailed') }
    }

    if (serverMessage) {
      return { title: t('player.error.genericTitle'), message: serverMessage }
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return { title: t('player.error.genericTitle'), message: error.message }
  }

  return { title: t('player.error.genericTitle'), message: t('player.couldNotGetStreamUrl') }
}
