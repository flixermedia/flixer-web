import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, mocked, userEvent, waitFor, within } from 'storybook/test'
import { getViewingAnalytics } from '../../api/analytics'
import ViewingAnalyticsPanel from './ViewingAnalyticsPanel.vue'

const meta = {
  title: 'Admin/Viewing Analytics',
  component: ViewingAnalyticsPanel,
  args: { screen: 'history' },
  beforeEach: () => {
    mocked(getViewingAnalytics).mockResolvedValue({
      video: [{ id: 'm', title: 'Movie', type: 'movie', sessions: 2, viewers: 1, watched_seconds: 50 }],
      live: [{ id: 'c', name: 'News', sessions: 1, viewers: 1, watched_seconds: 15 }],
      recent: [{ id: 's', viewer: 'Viewer', title: 'News', type: 'live', watched_seconds: 15, created_at: '2026-01-01T12:00:00Z', updated_at: '2026-01-01T12:01:00Z' }],
      totals: { video_sessions: 2, live_sessions: 1, watched_seconds: 65 },
      daily: [{ day: '2026-01-01', video_sessions: 2, live_sessions: 1, video_seconds: 50, live_seconds: 15 }],
    })
  },
} satisfies Meta<typeof ViewingAnalyticsPanel>
export default meta
type Story = StoryObj<typeof meta>

export const History: Story = {
  play: async ({ canvas, canvasElement }) => {
    expect(await canvas.findByText('News')).toBeVisible()
    expect(canvas.getByRole('cell', { name: 'Viewer' })).toBeVisible()
    const page = within(canvasElement.ownerDocument.body)
    const period = page.getByRole('combobox', { name: 'Reporting period' })
    await userEvent.click(period)
    await userEvent.click(await page.findByRole('option', { name: 'Last 7 days' }))
    await waitFor(() => expect(getViewingAnalytics).toHaveBeenCalledWith(7))
  },
}

export const Live: Story = {
  args: { screen: 'guide' },
  play: async ({ canvas }) => {
    expect(await canvas.findByText('News')).toBeVisible()
    expect(canvas.getAllByText('15')).toHaveLength(2)
    const chart = canvas.getByRole('group', { name: 'Daily viewing sessions' })
    expect(chart.querySelector('svg')).toBeInTheDocument()
    expect(chart.querySelectorAll('circle').length).toBeGreaterThan(0)
  },
}

export const Video: Story = {
  args: { screen: 'video' },
  play: async ({ canvas }) => {
    expect(await canvas.findByText('Movie')).toBeVisible()
    expect(canvas.getAllByText('50')).toHaveLength(2)
    const chart = canvas.getByRole('group', { name: 'Daily viewing sessions' })
    expect(chart.querySelector('svg')).toBeInTheDocument()
    expect(chart.querySelectorAll('circle').length).toBeGreaterThan(0)
  },
}
