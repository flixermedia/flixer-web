export const primaryButtonClass = 'rounded bg-flixer-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-flixer-primary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent disabled:cursor-not-allowed disabled:opacity-60'
export const quietButtonClass = 'rounded border border-flixer-border px-3 py-2 text-sm font-semibold transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent disabled:cursor-not-allowed disabled:opacity-60'
export const dangerButtonClass = 'rounded border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent disabled:cursor-not-allowed disabled:opacity-60'
export const inputClass = 'w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm outline-none focus:border-flixer-accent'

export const buttonClasses = { primary: primaryButtonClass, quiet: quietButtonClass, danger: dangerButtonClass } as const

export const textToneClasses = {
  default: 'text-flixer-text',
  muted: 'text-flixer-muted',
  danger: 'text-red-300',
  success: 'text-emerald-300',
  warning: 'text-amber-300',
} as const

export const badgeToneClasses = {
  default: 'border-white/10 bg-white/[0.06] text-white/80',
  success: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  warning: 'border-amber-300/30 bg-amber-300/10 text-amber-100',
  danger: 'border-red-400/30 bg-red-400/10 text-red-200',
  info: 'border-flixer-accent/30 bg-flixer-accent/10 text-flixer-accent',
} as const

export const alertToneClasses = {
  info: 'border-flixer-accent/30 bg-flixer-accent/10 text-flixer-text',
  warning: 'border-amber-300/30 bg-amber-300/10 text-amber-100',
  danger: 'border-red-400/30 bg-red-400/10 text-red-200',
  success: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
} as const

export const gapClasses: Record<number, string> = { 1: 'gap-1', 2: 'gap-2', 3: 'gap-3', 4: 'gap-4', 5: 'gap-5', 6: 'gap-6', 7: 'gap-7', 8: 'gap-8' }

export const aspectClasses = { poster: 'aspect-[2/3]', square: 'aspect-square', wide: 'aspect-video' } as const

export const headingClasses = { 1: 'text-2xl font-bold tracking-tight text-white sm:text-3xl', 2: 'text-lg font-semibold tracking-tight text-white', 3: 'text-base font-semibold text-white' } as const
