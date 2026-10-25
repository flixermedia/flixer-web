import { useI18n } from 'vue-i18n'
import type { AdminActivityEntry } from '../api'

const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
]

/** Wording for watch-activity entries, shared by the dashboard overview and the full activity page. */
export function useActivityFormat() {
  const { t, locale } = useI18n()

  function relativeTime(iso: string) {
    const seconds = (new Date(iso).getTime() - Date.now()) / 1000
    if (Math.abs(seconds) < 60) return t('admin.overview.justNow')
    const [unit, size] = UNITS.find(([, s]) => Math.abs(seconds) >= s) ?? UNITS[2]
    return new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto' }).format(Math.round(seconds / size), unit)
  }

  function activityTitle(entry: AdminActivityEntry) {
    if (entry.type === 'episode') {
      const code = entry.seasonNumber != null && entry.episodeNumber != null ? ` S${entry.seasonNumber}E${entry.episodeNumber}` : ''
      return `${entry.showTitle ?? ''}${code} ${entry.title}`.trim()
    }
    return entry.showTitle ? `${entry.showTitle} – ${entry.title}` : entry.title
  }

  function activityVerb(entry: AdminActivityEntry) {
    if (entry.completed) return t('admin.overview.finished')
    const pct = entry.durationSeconds > 0 ? Math.round((entry.positionSeconds / entry.durationSeconds) * 100) : 0
    return t('admin.overview.watching', { percent: pct })
  }

  function progressPercent(entry: AdminActivityEntry) {
    if (entry.completed) return 100
    return entry.durationSeconds > 0 ? Math.min(100, Math.round((entry.positionSeconds / entry.durationSeconds) * 100)) : 0
  }

  return { relativeTime, activityTitle, activityVerb, progressPercent }
}
