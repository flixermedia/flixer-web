import { reportViewing, type ViewingTarget } from '../../api/analytics'

export class ViewingTracker {
  private session: { id: string; target: ViewingTarget; watched: number; reported: number; started: number } | undefined
  private previous: { position: number; time: number } | undefined
  private readonly send: typeof reportViewing

  constructor(send = reportViewing) {
    this.send = send
  }

  sample(target: ViewingTarget | undefined, position: number, active: boolean, now = performance.now()) {
    if (!target || !Number.isFinite(position) || !active) {
      this.previous = undefined
      return
    }
    if (this.session && now - this.session.started >= 6 * 60 * 60 * 1000) this.finish()
    if (!this.session) {
      if (!globalThis.crypto?.getRandomValues) {
        console.error('[analytics] Secure randomness unavailable; viewing session cannot be recorded')
        return
      }
      const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16))
      bytes[6] = (bytes[6]! & 0x0f) | 0x40
      bytes[8] = (bytes[8]! & 0x3f) | 0x80
      const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
      this.session = { id: `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`, target, watched: 0, reported: 0, started: now }
      this.sendReport()
    }
    if (this.previous) {
      const elapsed = Math.max(0, (now - this.previous.time) / 1000)
      const advanced = position - this.previous.position
      if (elapsed <= 30 && advanced > 0 && advanced <= elapsed + 2) this.session.watched += Math.min(advanced, elapsed)
    }
    this.previous = { position, time: now }
    if (this.session.watched - this.session.reported >= 15) {
      this.session.reported = this.session.watched
      this.sendReport()
    }
  }

  finish() {
    if (this.session) this.sendReport()
    this.session = undefined
    this.previous = undefined
  }

  private sendReport() {
    if (!this.session) return
    const report = { ...this.session.target, id: this.session.id, watchedSeconds: this.session.watched }
    void Promise.resolve().then(() => this.send(report)).catch((error: unknown) => console.error('[analytics] Could not report viewing session', error))
  }
}
