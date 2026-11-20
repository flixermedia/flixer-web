import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, mocked, userEvent, waitFor } from 'storybook/test'
import { browseArtists, browseMedia, getPreferences, getSearchGenres, listPluginPages, updatePreferences } from '../api'
import { api } from '../api/client'
import { clearPluginPages } from '../composables/usePluginPages'
import { refreshPageNavigation, usePageNavigation } from '../components/pageBuilder/usePageNavigation'
import BrowseView from './BrowseView.vue'

const meta = {
  title: 'Browse/BrowseView',
  component: BrowseView,
  parameters: { layout: 'fullscreen' },
  args: { kind: 'movie' },
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
    mocked(browseArtists).mockResolvedValue({ items: [], total: 0 })
    mocked(browseMedia).mockResolvedValue({ items: [], total: 0 })
    mocked(getPreferences).mockResolvedValue({ browseColumns: 0 } as never)
    mocked(getSearchGenres).mockResolvedValue(['Drama'])
    mocked(updatePreferences).mockResolvedValue({ browseColumns: 4 } as never)
    return () => { api.defaults.adapter = adapter }
  },
} satisfies Meta<typeof BrowseView>

export default meta
type Story = StoryObj<typeof meta>

export const FilterAndColumns: Story = {
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByRole('combobox', { name: 'Columns' })).toBeVisible())

    await userEvent.click(canvas.getByRole('button', { name: 'Filters' }))
    await userEvent.click(canvas.getByRole('combobox', { name: 'Genre' }))
    await userEvent.click(canvas.getByRole('option', { name: 'Drama' }))
    await waitFor(() => expect(mocked(browseMedia)).toHaveBeenLastCalledWith(
      'movie',
      'added',
      0,
      expect.anything(),
      expect.objectContaining({ genre: 'Drama' }),
    ))

    await userEvent.click(canvas.getByRole('combobox', { name: 'Columns' }))
    await userEvent.click(canvas.getByRole('option', { name: '4 columns' }))
    await waitFor(() => expect(mocked(updatePreferences)).toHaveBeenLastCalledWith({ browseColumns: 4 }))
  },
}
