import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { createAgent } from '@ui-sdk/vue/agent'
import { expect, mocked, userEvent, waitFor } from 'storybook/test'
import { useRouter } from 'vue-router'
import { api } from '../api/client'
import { getSearchGenres, searchMedia } from '../api/media'
import { listPluginPages, searchPluginSections } from '../api/plugins'
import SearchView from './SearchView.vue'

const meta = {
  title: 'Search/SearchView',
  component: SearchView,
  parameters: { layout: 'fullscreen' },
  beforeEach: () => {
    mocked(listPluginPages).mockResolvedValue([])
    mocked(getSearchGenres).mockResolvedValue(['Drama'])
    mocked(searchMedia).mockResolvedValue([])
    mocked(searchPluginSections).mockResolvedValue({ sections: [] })
    const adapter = api.defaults.adapter
    api.defaults.adapter = async (config) => ({
      config, headers: {}, status: 200, statusText: 'OK',
      data: config.url?.endsWith('/requests/config') ? { enabled: false } : [],
    })
    return () => { api.defaults.adapter = adapter }
  },
} satisfies Meta<typeof SearchView>

export default meta
type Story = StoryObj<typeof meta>

export const SearchAndFilters: Story = {
  render: () => ({
    components: { SearchView },
    setup() {
      const { currentRoute } = useRouter()
      return { currentRoute }
    },
    template: '<SearchView /><output aria-label="Search parameters">{{ JSON.stringify(currentRoute.query) }}</output>',
  }),
  play: async ({ canvas }) => {
    const search = canvas.getByRole('searchbox', { name: 'Search' })
    await waitFor(() => expect(search).toHaveFocus())
    await userEvent.type(search, 'space opera')
    await waitFor(() => expect(canvas.getByLabelText('Search parameters')).toHaveTextContent('"q":"space opera"'))

    await userEvent.click(canvas.getByRole('button', { name: 'Filters' }))
    const unwatched = canvas.getByRole('checkbox', { name: 'Hide Watched' })
    unwatched.focus()
    await userEvent.keyboard(' ')
    await expect(unwatched).toBeChecked()
    await waitFor(() => expect(canvas.getByLabelText('Search parameters')).toHaveTextContent('"unwatched":"true"'))

    await userEvent.click(canvas.getByRole('combobox', { name: 'Genre' }))
    await userEvent.click(canvas.getByRole('option', { name: 'Drama' }))
    await waitFor(() => expect(canvas.getByLabelText('Search parameters')).toHaveTextContent('"genre":"Drama"'))

    await userEvent.click(canvas.getByRole('combobox', { name: 'Sort By' }))
    await userEvent.click(canvas.getByRole('option', { name: 'Title' }))
    await waitFor(() => expect(canvas.getByLabelText('Search parameters')).toHaveTextContent('"sort":"title"'))

    expect(createAgent().snapshot()).toEqual(expect.arrayContaining([
      expect.objectContaining({ component: 'input', label: 'Search' }),
      expect.objectContaining({ component: 'checkbox', label: 'Hide Watched' }),
    ]))
  },
}
