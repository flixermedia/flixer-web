import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, mocked } from 'storybook/test'
import { getViewingAnalytics } from '../../../api/analytics'
import ViewingAnalyticsWidget from './ViewingAnalyticsWidget.vue'

const meta = {
  title: 'Admin/Dashboard/Viewing Analytics',
  component: ViewingAnalyticsWidget,
  beforeEach: () => {
    mocked(getViewingAnalytics).mockResolvedValue({
      video: [], live: [], recent: [], daily: [],
      totals: { video_sessions: 3, live_sessions: 2, watched_seconds: 45 },
    })
  },
} satisfies Meta<typeof ViewingAnalyticsWidget>
export default meta
type Story = StoryObj<typeof meta>

export const Summary: Story = {
  play: async ({ canvas }) => {
    expect(await canvas.findByText('3')).toBeVisible()
    expect(canvas.getByText('2')).toBeVisible()
    expect(canvas.getByText('45')).toBeVisible()
    expect(canvas.getByRole('link', { name: 'Open viewing history' })).toHaveAttribute('href', '/admin?tab=analytics&page=analyticsHistory')
  },
}
