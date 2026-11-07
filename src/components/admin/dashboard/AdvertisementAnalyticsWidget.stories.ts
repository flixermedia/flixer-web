import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, mocked } from 'storybook/test'
import { getAnalyticsSnapshot } from '../../../api/analytics'
import AdvertisementAnalyticsWidget from './AdvertisementAnalyticsWidget.vue'

const meta = {
  title: 'Admin/Dashboard/Advertisement Analytics',
  component: AdvertisementAnalyticsWidget,
  beforeEach: () => {
    mocked(getAnalyticsSnapshot).mockResolvedValue({
      video: [], music: [], orders: [], subscriptions: [], advertisements: { total: 1, enabled: 1 },
      adViews: [{ id: 'ad', name: 'Example', views: 3, completed: 2, skipped: 1, clicked: 1, watched_seconds: 45 }],
      adTrend: [],
    })
  },
} satisfies Meta<typeof AdvertisementAnalyticsWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Summary: Story = {
  play: async ({ canvas }) => {
    expect(await canvas.findByText('Views:')).toBeVisible()
    expect(canvas.getByText('3')).toBeVisible()
    expect(canvas.getByText('45')).toBeVisible()
    expect(canvas.getByRole('link', { name: 'Open advertising analytics' })).toHaveAttribute('href', '/admin?tab=analytics&page=analyticsAdvertising')
  },
}
