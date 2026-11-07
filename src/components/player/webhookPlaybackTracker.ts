import { reportWebhookPlayback, type WebhookEvent, type WebhookTarget } from '../../api/userWebhooks'
import { getAccessToken } from '../../api/client'

/** Emits ordered playback transitions, without sending duplicate play or pause events. */
export class WebhookPlaybackTracker {
  private target: WebhookTarget | undefined
  private playing = false
  private pending: Promise<void> = Promise.resolve()
  private readonly report: typeof reportWebhookPlayback

  constructor(report = reportWebhookPlayback) {
    this.report = report
  }

  play(target: WebhookTarget | undefined, position: number) {
    if (!target) return
    if (this.target && JSON.stringify(this.target) !== JSON.stringify(target)) this.stop(position)
    if (this.playing) return
    const event = this.target ? 'playback.resumed' : 'playback.started'
    this.target = target
    this.playing = true
    this.send(event, target, position)
  }

  pause(position: number) {
    if (!this.target || !this.playing) return
    this.playing = false
    this.send('playback.paused', this.target, position)
  }

  stop(position: number) {
    if (!this.target) return
    this.send('playback.stopped', this.target, position)
    this.target = undefined
    this.playing = false
  }

  private send(event: WebhookEvent, target: WebhookTarget, position: number) {
    const safePosition = Number.isFinite(position) ? Math.min(604800, Math.max(0, position)) : 0
    const token = typeof localStorage === 'undefined' ? null : getAccessToken()
    this.pending = this.pending.then(() => {
      if (typeof localStorage !== 'undefined' && getAccessToken() !== token) {
        console.warn('[webhooks] Playback event discarded after the signed-in session changed')
        return
      }
      return this.report(event, target, safePosition)
    }).catch((error: unknown) => {
      console.error('[webhooks] Could not report playback event', error)
    })
  }
}
