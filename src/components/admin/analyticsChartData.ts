export interface DailyCount {
  day: string
  value: number
}

/** Fill days between the first and last observed dates without inventing a reporting boundary. */
export function dailyCounts(rows: DailyCount[]): DailyCount[] {
  const totals = new Map<string, number>()
  for (const { day, value } of rows) totals.set(day, (totals.get(day) ?? 0) + value)
  const days = [...totals.keys()].sort()
  if (!days.length) return []
  const result: DailyCount[] = []
  const current = new Date(`${days[0]}T00:00:00Z`)
  const last = days[days.length - 1]!
  while (current.toISOString().slice(0, 10) <= last) {
    const day = current.toISOString().slice(0, 10)
    result.push({ day, value: totals.get(day) ?? 0 })
    current.setUTCDate(current.getUTCDate() + 1)
  }
  return result
}
