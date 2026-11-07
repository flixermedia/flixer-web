import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, mocked, userEvent, waitFor } from 'storybook/test'
import { getMusicAnalytics, getOrderAnalytics } from '../../api/analytics'
import PeriodAnalyticsPanel from './PeriodAnalyticsPanel.vue'

const meta = {
  title: 'Admin/Period Analytics',
  component: PeriodAnalyticsPanel,
  args: { screen: 'music' },
  beforeEach: () => {
    mocked(getMusicAnalytics).mockImplementation(async (days) => ({
      tracks: [{ id: 'song', title: 'Song', plays: 4, listeners: 2 }],
      daily: [{ day: days === 90 ? '2026-01-02' : '2026-01-01', plays: 4 }],
    }))
    mocked(getOrderAnalytics).mockResolvedValue({
      rows: [
        { day: '2026-01-01', kind: 'purchase', currency: 'USD', status: 'paid', orders: 1, total_minor: '500', refunded_minor: '0' },
        { day: '2026-01-01', kind: 'rental', currency: 'EUR', status: 'pending', orders: 2, total_minor: '100', refunded_minor: '0' },
        { day: '2026-01-03', kind: 'purchase', currency: 'USD', status: 'paid', orders: 1, total_minor: '200', refunded_minor: '0' },
      ],
    })
  },
} satisfies Meta<typeof PeriodAnalyticsPanel>
export default meta
type Story = StoryObj<typeof meta>

export const Music: Story = {
  play: async ({ canvas }) => {
    expect(await canvas.findByText('Song')).toBeVisible()
    const chart = canvas.getByRole('group', { name: 'Daily song starts' })
    expect(chart.querySelector('svg')).toBeInTheDocument()
    expect(chart.querySelectorAll('circle').length).toBeGreaterThan(0)
    await userEvent.selectOptions(canvas.getByLabelText('Reporting period'), '90')
    await waitFor(() => expect(getMusicAnalytics).toHaveBeenCalledWith(90))
    await waitFor(() => expect(canvas.getByRole('group', { name: 'Daily song starts' }).querySelector('tbody')?.textContent).toContain('2026-01-02'))
  },
}

export const EmptyMusic: Story = {
  beforeEach: () => {
    mocked(getMusicAnalytics).mockResolvedValue({ tracks: [], daily: [] })
  },
  play: async ({ canvas }) => {
    expect(await canvas.findByText('No data available yet.')).toBeVisible()
    expect(canvas.queryByRole('group', { name: 'Daily song starts' })).not.toBeInTheDocument()
  },
}

export const Orders: Story = {
  args: { screen: 'orders' },
  play: async ({ canvas }) => {
    expect(await canvas.findByText('EUR')).toBeVisible()
    expect(canvas.getAllByText('USD')).toHaveLength(2)
    expect(canvas.getByText('500')).toBeVisible()
    const chart = canvas.getByRole('group', { name: 'Daily order count' })
    expect(chart.querySelector('svg')).toBeInTheDocument()
    expect(chart.querySelectorAll('circle').length).toBeGreaterThan(0)
    const rows = chart.querySelectorAll('tbody tr')
    expect(rows).toHaveLength(3)
    expect(rows[0]?.textContent).toContain('2026-01-013')
    expect(rows[1]?.textContent).toContain('2026-01-020')
  },
}
