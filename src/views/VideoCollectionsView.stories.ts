import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, mocked, userEvent } from 'storybook/test'
import { api } from '../api/client'
import { listPluginPages } from '../api'
import { getAutomaticCollections, getVideoCollections } from '../api/userMedia'
import { clearPluginPages } from '../composables/usePluginPages'
import { refreshPageNavigation, usePageNavigation } from '../components/pageBuilder/usePageNavigation'
import VideoCollectionsView from './VideoCollectionsView.vue'

const meta = {
  title: 'Collections/VideoCollectionsView',
  component: VideoCollectionsView,
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
    mocked(getAutomaticCollections).mockResolvedValue([])
    mocked(getVideoCollections).mockResolvedValue([])
    return () => { api.defaults.adapter = adapter }
  },
} satisfies Meta<typeof VideoCollectionsView>

export default meta
type Story = StoryObj<typeof meta>

export const SortCollections: Story = {
  play: async ({ canvas }) => {
    const sort = await canvas.findByRole('combobox', { name: 'Sort By' })
    await userEvent.click(sort)
    await userEvent.click(canvas.getByRole('option', { name: 'Item count' }))
    await expect(sort).toHaveTextContent('Item count')
  },
}
