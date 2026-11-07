import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, mocked, userEvent, waitFor, within } from 'storybook/test'
import { deleteUserWebhook, getUserWebhooks, saveUserWebhook } from '../../api/userWebhooks'
import UserWebhooksSection from './UserWebhooksSection.vue'

const hook = { id: 'one', name: 'Living room', url: 'http://home.local/automation', enabled: true }
const meta = {
  title: 'Settings/Personal webhooks',
  component: UserWebhooksSection,
  beforeEach: () => {
    mocked(getUserWebhooks).mockResolvedValue({ available: true, hooks: [hook] })
    mocked(saveUserWebhook).mockImplementation(async (value, id) => ({ ...value, id: id ?? 'two' }))
    mocked(deleteUserWebhook).mockResolvedValue(undefined)
  },
} satisfies Meta<typeof UserWebhooksSection>
export default meta
type Story = StoryObj<typeof meta>

export const Manage: Story = {
  play: async ({ canvas, canvasElement }) => {
    await canvas.findByText('Living room')
    await userEvent.click(canvas.getByRole('button', { name: 'Edit' }))
    const body = within(canvasElement.ownerDocument.body)
    const dialog = within(await body.findByRole('dialog', { name: 'Edit webhook' }))
    expect(dialog.getByLabelText('Name')).toHaveValue('Living room')
    expect(dialog.getByLabelText('Destination URL')).toHaveValue(hook.url)
    expect(dialog.getByLabelText('Enabled')).toBeChecked()
    await userEvent.clear(dialog.getByLabelText('Name'))
    await userEvent.type(dialog.getByLabelText('Name'), 'Cinema')
    await userEvent.click(dialog.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(saveUserWebhook).toHaveBeenCalledWith({ name: 'Cinema', url: hook.url, enabled: true }, 'one'))
    await canvas.findByText('Cinema')
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument())
    await userEvent.click(canvas.getByRole('button', { name: 'Delete' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Confirm delete' }))
    await waitFor(() => expect(deleteUserWebhook).toHaveBeenCalledWith('one'))
  },
}

export const CreateAndCancel: Story = {
  play: async ({ canvas, canvasElement }) => {
    await canvas.findByText('Living room')
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Edit' }))
    let dialog = within(await body.findByRole('dialog', { name: 'Edit webhook' }))
    await userEvent.clear(dialog.getByLabelText('Name'))
    await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument())
    expect(canvas.getByText('Living room')).toBeVisible()
    expect(saveUserWebhook).not.toHaveBeenCalled()

    await userEvent.click(canvas.getByRole('button', { name: 'Create webhook' }))
    dialog = within(await body.findByRole('dialog', { name: 'Create a webhook' }))
    expect(dialog.getByLabelText('Name')).toHaveValue('')
    expect(dialog.getByLabelText('Destination URL')).toHaveValue('')
    expect(dialog.getByLabelText('Enabled')).toBeChecked()
    await userEvent.type(dialog.getByLabelText('Name'), 'Lights')
    await userEvent.type(dialog.getByLabelText('Destination URL'), 'https://example.com/lights')
    await userEvent.click(dialog.getByRole('button', { name: 'Create webhook' }))
    await waitFor(() => expect(saveUserWebhook).toHaveBeenCalledWith({ name: 'Lights', url: 'https://example.com/lights', enabled: true }, undefined))
    await canvas.findByText('Lights')
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument())
  },
}

export const SavingAndError: Story = {
  play: async ({ canvas, canvasElement }) => {
    let rejectSave!: (error: Error) => void
    mocked(saveUserWebhook).mockImplementationOnce(() => new Promise((_, reject) => { rejectSave = reject }))
    await canvas.findByText('Living room')
    await userEvent.click(canvas.getByRole('button', { name: 'Edit' }))
    const body = within(canvasElement.ownerDocument.body)
    const dialog = within(await body.findByRole('dialog', { name: 'Edit webhook' }))
    await userEvent.click(dialog.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(dialog.getByRole('button', { name: 'Cancel' })).toBeDisabled())
    await userEvent.keyboard('{Escape}')
    expect(body.getByRole('dialog', { name: 'Edit webhook' })).toBeVisible()
    rejectSave(new Error('Save failed'))
    await waitFor(() => expect(dialog.getByRole('button', { name: 'Save' })).toBeEnabled())
    expect(dialog.getByLabelText('Name')).toHaveValue('Living room')
    await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument())
  },
}

export const Disabled: Story = {
  beforeEach: () => mocked(getUserWebhooks).mockResolvedValue({ available: false, hooks: [hook] }),
  play: async ({ canvas }) => {
    expect(await canvas.findByText('Personal webhooks are disabled or unavailable for your account. Contact an administrator.')).toBeVisible()
    expect(canvas.queryByRole('button', { name: 'Create webhook' })).not.toBeInTheDocument()
    expect(canvas.getByRole('button', { name: 'Edit' })).toBeDisabled()
  },
}
