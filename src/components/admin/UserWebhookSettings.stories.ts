import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, mocked, userEvent, waitFor } from 'storybook/test'
import { getWebhookConfig, saveWebhookConfig } from '../../api/userWebhooks'
import UserWebhookSettings from './UserWebhookSettings.vue'

const meta = {
  title: 'Admin/Personal webhooks',
  component: UserWebhookSettings,
  beforeEach: () => {
    mocked(getWebhookConfig).mockResolvedValue({ enabled: false, audience: 'admins', allowedUrls: ['regex:https?://.*'] })
    mocked(saveWebhookConfig).mockImplementation(async (config) => config)
  },
} satisfies Meta<typeof UserWebhookSettings>
export default meta
type Story = StoryObj<typeof meta>

export const Configure: Story = {
  play: async ({ canvas }) => {
    const urls = await canvas.findByLabelText('Allowed destination URLs or regex rules, one per line')
    expect(urls).toHaveValue('regex:https?://.*')
    await userEvent.clear(urls)
    await userEvent.type(urls, 'regex:https://.*\\.example\\.com/.*')
    await userEvent.selectOptions(canvas.getByLabelText('Who can create webhooks'), 'everyone')
    await userEvent.click(canvas.getByRole('button', { name: 'Save webhook settings' }))
    await waitFor(() => expect(saveWebhookConfig).toHaveBeenCalledWith({ enabled: false, audience: 'everyone', allowedUrls: ['regex:https://.*\\.example\\.com/.*'] }))
  },
}
