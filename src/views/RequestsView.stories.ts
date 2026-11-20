import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, mocked, userEvent, waitFor } from 'storybook/test'
import { getRequestsConfig, listMediaRequests, listPluginPages } from '../api'
import { api } from '../api/client'
import { clearPluginPages } from '../composables/usePluginPages'
import { refreshPageNavigation, usePageNavigation } from '../components/pageBuilder/usePageNavigation'
import { useRequestsConfig } from '../composables/useRequestsConfig'
import RequestsView from './RequestsView.vue'

const meta = {
  title: 'Requests/RequestsView',
  component: RequestsView,
  parameters: { layout: 'fullscreen' },
  beforeEach: async () => {
    const adapter = api.defaults.adapter
    api.defaults.adapter = async (config) => ({
      config, headers: {}, status: 200, statusText: 'OK',
      data: config.url?.endsWith('/page-site/navigation') ? [] : config.url?.endsWith('/requests/config') ? { enabled: false } : [],
    })
    clearPluginPages()
    mocked(listPluginPages).mockResolvedValue([])
    usePageNavigation().pages.value = []
    await refreshPageNavigation()
    useRequestsConfig().config.value = null
    mocked(getRequestsConfig).mockResolvedValue({ isAdmin: false } as never)
    mocked(listMediaRequests).mockResolvedValue({
      items: [{
        id: 'request-1',
        title: 'Example request',
        year: null,
        type: 'movie',
        poster: null,
        status: 'pending',
        serviceName: null,
        requestedBy: { id: 'user-1', username: 'viewer', displayName: null },
        declineReason: null,
        error: null,
      }] as never,
      total: 1,
      counts: { pending: 0, approved: 0, declined: 0, failed: 0, available: 0 },
    })
    return () => { api.defaults.adapter = adapter }
  },
} satisfies Meta<typeof RequestsView>

export default meta
type Story = StoryObj<typeof meta>

export const FilterByType: Story = {
  play: async ({ canvas }) => {
    const type = await canvas.findByRole('combobox', { name: 'All Types' })
    await userEvent.click(type)
    await userEvent.click(canvas.getByRole('option', { name: 'TV Show' }))

    await waitFor(() => expect(mocked(listMediaRequests)).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: 'tv' }),
    ))
    const deleteButton = await canvas.findByRole('button', { name: 'Delete' })
    await expect(deleteButton).toHaveAttribute('data-slot', 'button')
    await expect(deleteButton).toHaveAttribute('type', 'button')
  },
}
