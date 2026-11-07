import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, mocked, userEvent, waitFor } from 'storybook/test'
import { getAnalyticsSnapshot } from '../../api/analytics'
import AnalyticsPanel from './AnalyticsPanel.vue'

const meta = {
  title: 'Admin/Analytics',
  component: AnalyticsPanel,
  args: { screen: 'advertising' },
  beforeEach: () => {
    mocked(getAnalyticsSnapshot).mockResolvedValue({
      video: [], music: [], orders: [], subscriptions: [], advertisements: { total: 1, enabled: 1 },
      adViews: [{ id: 'ad', name: 'Example', views: 3, completed: 2, skipped: 1, clicked: 1, watched_seconds: 45 }],
      adTrend: [{ day: '2026-01-01', views: 3, watched_seconds: 45 }, { day: '2026-01-02', views: 0, watched_seconds: 0 }],
    })
  },
} satisfies Meta<typeof AnalyticsPanel>
export default meta
type Story = StoryObj<typeof meta>

export const Advertising: Story = {
  play: async ({ canvas }) => {
    await canvas.findByRole('cell', { name: '2026-01-01' })
    expect(canvas.getByRole('cell', { name: '2026-01-02' })).toBeVisible()
    const chart = canvas.getByRole('group', { name: 'Daily advertisement views' })
    expect(chart.querySelector('svg')).toBeInTheDocument()
    expect(chart.querySelectorAll('circle').length).toBeGreaterThan(0)
    expect(getAnalyticsSnapshot).toHaveBeenCalledWith(30)
    await userEvent.selectOptions(canvas.getByLabelText('Reporting period'), '7')
    await waitFor(() => expect(getAnalyticsSnapshot).toHaveBeenCalledWith(7))
  },
}
