import { describe, expect, it } from 'vitest'
import { dailyCounts } from './analyticsChartData'

describe('daily chart counts', () => {
  it('sorts, aggregates and fills missing UTC calendar dates', () => {
    expect(dailyCounts([
      { day: '2024-03-01', value: 3 }, { day: '2024-02-28', value: 2 }, { day: '2024-03-01', value: 4 },
    ])).toEqual([
      { day: '2024-02-28', value: 2 }, { day: '2024-02-29', value: 0 }, { day: '2024-03-01', value: 7 },
    ])
  })

  it('handles empty and single-day series', () => {
    expect(dailyCounts([])).toEqual([])
    expect(dailyCounts([{ day: '2026-01-01', value: 0 }])).toEqual([{ day: '2026-01-01', value: 0 }])
  })
})
