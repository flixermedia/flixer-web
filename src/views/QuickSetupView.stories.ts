import { BrowserQRCodeReader } from '@zxing/browser'
import { Exception, NotFoundException } from '@zxing/library'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import QRCode from 'qrcode'
import { expect, spyOn, userEvent, waitFor } from 'storybook/test'
import QuickSetupView from './QuickSetupView.vue'

const meta = {
  title: 'Setup/QuickSetupView',
  component: QuickSetupView,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof QuickSetupView>

export default meta
type Story = StoryObj<typeof meta>

export const ScansTvCode: Story = {
  play: async ({ canvas }) => {
    const token = 'a'.repeat(43)
    const pairingUrl = `http://192.168.1.25:43210/pair?token=${token}`
    const image = new Image()
    image.src = await QRCode.toDataURL(pairingUrl, { errorCorrectionLevel: 'M', margin: 4, width: 320 })
    await image.decode()
    const frame = document.createElement('canvas')
    frame.width = 1280
    frame.height = 720
    const context = frame.getContext('2d')
    if (!context) throw new Error('Canvas is unavailable')
    context.fillStyle = '#aaa'
    context.fillRect(0, 0, frame.width, frame.height)
    context.drawImage(image, 480, 200)
    const stream = frame.captureStream(10)
    const camera = spyOn(navigator.mediaDevices, 'getUserMedia').mockResolvedValue(stream)
    const submit = spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {})
    let form: HTMLFormElement | null = null
    try {
      await userEvent.click(canvas.getByRole('button', { name: 'Scan TV code' }))
      if (window.location.protocol !== 'https:') {
        await waitFor(() => expect(canvas.getByRole('alert')).toHaveTextContent('Enter a valid HTTPS server address'))
        return
      }
      await waitFor(() => expect(canvas.getByRole('button', { name: 'Connect TV' })).toBeVisible(), { timeout: 10000 })
      expect(camera).toHaveBeenCalledWith({
        audio: false,
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      await userEvent.click(canvas.getByRole('button', { name: 'Connect TV' }))
      expect(submit).toHaveBeenCalledOnce()
      form = document.querySelector(`form[action="${pairingUrl}"]`)
      expect(form).not.toBeNull()
      expect([...new FormData(form!).entries()]).toEqual([['server', window.location.origin]])
    } finally {
      form?.remove()
      stream.getTracks().forEach((track) => track.stop())
      camera.mockRestore()
      submit.mockRestore()
    }
  },
}

export const ScannerFailure: Story = {
  play: async ({ canvas }) => {
    const stop = spyOn(BrowserQRCodeReader.prototype, 'decodeFromConstraints').mockImplementation(async (_constraints, _preview, callback) => {
      const controls = { stop: () => {} }
      callback(undefined, new NotFoundException(), controls)
      callback(undefined, new Exception('Camera frame failed'), controls)
      return controls
    })
    try {
      await userEvent.click(canvas.getByRole('button', { name: 'Scan TV code' }))
      await waitFor(() => expect(canvas.getByRole('alert')).toHaveTextContent('The scanner stopped unexpectedly. Try scanning again.'))
      expect(canvas.getByRole('button', { name: 'Scan TV code' })).toBeEnabled()
    } finally {
      stop.mockRestore()
    }
  },
}

export const CameraPreview: Story = {
  play: async ({ canvas, canvasElement }) => {
    const frame = document.createElement('canvas')
    frame.width = 640
    frame.height = 480
    const stream = frame.captureStream(10)
    const camera = spyOn(navigator.mediaDevices, 'getUserMedia').mockResolvedValue(stream)
    try {
      await userEvent.click(canvas.getByRole('button', { name: 'Scan TV code' }))
      await waitFor(() => expect(canvas.getByRole('button', { name: 'Cancel' })).toBeVisible())
      const video = canvasElement.querySelector('video')
      if (!video) throw new Error('Camera preview is missing')
      const bounds = video.getBoundingClientRect()
      expect(bounds.width).toBeGreaterThan(0)
      expect(bounds.width).toBeCloseTo(bounds.height, 0)
      expect(getComputedStyle(video).objectFit).toBe('cover')
      await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }))
    } finally {
      stream.getTracks().forEach((track) => track.stop())
      camera.mockRestore()
    }
  },
}
