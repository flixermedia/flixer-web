import { BrowserQRCodeReader } from '@zxing/browser'
import { BarcodeFormat, Result } from '@zxing/library'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, mocked, spyOn, userEvent, waitFor } from 'storybook/test'
import { decideQuickConnect, getQuickConnectStatus } from '../../api/auth'
import QuickConnectApproval from './QuickConnectApproval.vue'

const meta = {
  title: 'Auth/QuickConnectApproval',
  component: QuickConnectApproval,
  args: { allowScanner: true },
  beforeEach: () => {
    mocked(getQuickConnectStatus).mockResolvedValue({ enabled: true })
    mocked(decideQuickConnect).mockResolvedValue(undefined)
  },
} satisfies Meta<typeof QuickConnectApproval>

export default meta
type Story = StoryObj<typeof meta>

export const ManualCode: Story = {
  play: async ({ canvas }) => {
    const input = await canvas.findByLabelText('Your one-time code')
    await userEvent.type(input, '2ABC2345')
    expect(mocked(decideQuickConnect)).not.toHaveBeenCalled()
    await userEvent.click(canvas.getByRole('button', { name: 'Approve sign-in' }))
    await waitFor(() => expect(mocked(decideQuickConnect)).toHaveBeenCalledWith('2ABC2345', 'approve'))
  },
}

export const ScanCode: Story = {
  play: async ({ canvas }) => {
    const scanner = spyOn(BrowserQRCodeReader.prototype, 'decodeFromConstraints').mockImplementation(async (_constraints, _preview, callback) => {
      const controls = { stop: () => {} }
      const result = (value: string) => new Result(value, new Uint8Array(), 0, [], BarcodeFormat.QR_CODE)
      callback(result(`http://192.168.1.25:43210/pair?token=${'a'.repeat(43)}`), undefined, controls)
      callback(result('https://flixer.example/quick-connect?code=2ABC2345'), undefined, controls)
      return controls
    })
    try {
      await userEvent.click(await canvas.findByRole('button', { name: 'Scan TV sign-in code' }))
      await waitFor(() => expect(canvas.getByLabelText('Your one-time code')).toHaveValue('2ABC2345'))
      expect(mocked(decideQuickConnect)).not.toHaveBeenCalled()
      await userEvent.click(canvas.getByRole('button', { name: 'Approve sign-in' }))
      await waitFor(() => expect(mocked(decideQuickConnect)).toHaveBeenCalledWith('2ABC2345', 'approve'))
    } finally {
      scanner.mockRestore()
    }
  },
}
