import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, mocked, userEvent, waitFor } from 'storybook/test'
import { pollQuickConnect, startQuickConnect, type AuthResult } from '../../api'
import TvAuthScreen from './TvAuthScreen.vue'

const auth: AuthResult = {
  accessToken: 'test-token', tokenType: 'Bearer', expiresIn: 3600,
  session: { id: 'session', expiresAt: '2099-01-01T00:00:00.000Z' },
  user: { id: 'user', username: 'alex', displayName: 'Alex', email: null, role: 'user' },
}

const meta = {
  title: 'Auth/TvAuthScreen',
  component: TvAuthScreen,
  parameters: { layout: 'fullscreen' },
  args: {
    appName: 'Flixer', registration: false, registrationEnabled: true, registrationStatusError: '',
    quickConnectEnabled: true, quickConnectLoading: false, quickConnectStatusError: '',
    isSubmitting: false, passkeyRequired: false, loginBanner: '', sessionCheckUnavailable: false,
    canResend: false, isResending: false, nativeApp: false,
    onSubmit: fn(), onAuthenticated: fn(), onSwitchMode: fn(), onCancelSecondFactor: fn(), onResend: fn(),
  },
  beforeEach: () => {
    mocked(startQuickConnect).mockResolvedValue({
      requestId: 'request', userCode: '2ABC2345', pollToken: 'poll-secret',
      expiresAt: new Date(Date.now() + 60_000).toISOString(), appUrl: 'https://flixer.example',
    })
    mocked(pollQuickConnect).mockResolvedValue({ status: 'pending' })
  },
} satisfies Meta<typeof TvAuthScreen>

export default meta
type Story = StoryObj<typeof meta>

export const PhoneAndPassword: Story = {
  play: async ({ canvas, canvasElement, args }) => {
    await waitFor(() => expect(canvas.getByAltText('QR code to sign in and approve this TV')).toBeVisible())
    expect(canvas.getByText('2ABC2345')).toBeVisible()
    expect(mocked(pollQuickConnect)).toHaveBeenCalledWith('request', 'poll-secret')
    const main = canvasElement.querySelector('main')!
    expect(main.scrollHeight).toBeLessThanOrEqual(main.clientHeight)
    await userEvent.type(canvas.getByLabelText('Username'), 'alex')
    await userEvent.type(canvas.getByLabelText('Password'), 'password')
    await userEvent.click(canvas.getByRole('button', { name: 'Sign in to Flixer' }))
    expect(args.onSubmit).toHaveBeenCalledWith({ username: 'alex', password: 'password', rememberBiometric: false })
  },
}

export const TextSelection: Story = {
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByText('2ABC2345')).toBeVisible())
    const root = document.documentElement
    const wasTv = root.classList.contains('flixer-tv')
    const heading = canvas.getByRole('heading', { name: 'Sign in on your TV' })
    const code = canvas.getByText('2ABC2345')
    const input = canvas.getByLabelText('Username') as HTMLInputElement
    try {
      root.classList.add('flixer-tv')
      expect(getComputedStyle(heading).userSelect).toBe('none')
      expect(getComputedStyle(code).userSelect).toBe('none')
      expect(getComputedStyle(input).userSelect).toBe('text')
      root.classList.remove('flixer-tv')
      expect(getComputedStyle(code).userSelect).toBe('all')
    } finally {
      root.classList.toggle('flixer-tv', wasTv)
    }
  },
}

export const PhoneApproval: Story = {
  beforeEach: () => { mocked(pollQuickConnect).mockResolvedValue({ status: 'approved', auth }) },
  play: async ({ args }) => {
    await waitFor(() => expect(args.onAuthenticated).toHaveBeenCalledWith(auth))
  },
}

export const Registration: Story = {
  args: { registration: true },
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByAltText('QR code to sign in and approve this TV')).toBeVisible())
    expect(canvas.queryByLabelText('Password')).toBeNull()
    expect(canvas.getByRole('button', { name: 'Back to Sign In' })).toBeVisible()
  },
}

export const LinkingDisabled: Story = {
  args: { quickConnectEnabled: false },
  play: async ({ canvas }) => {
    expect(canvas.getByText(/Quick Connect is disabled/)).toBeVisible()
    expect(canvas.queryByAltText('QR code to sign in and approve this TV')).toBeNull()
    expect(canvas.getByLabelText('Password')).toBeVisible()
    expect(mocked(startQuickConnect)).not.toHaveBeenCalled()
  },
}

export const PasswordNeedsPasskey: Story = {
  args: { passkeyRequired: true },
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByAltText('QR code to sign in and approve this TV')).toBeVisible())
    expect(canvas.getByText(/sign in fully on your phone/i)).toBeVisible()
    expect(canvas.queryByLabelText('Password')).toBeNull()
  },
}

export const Expired: Story = {
  beforeEach: () => { mocked(pollQuickConnect).mockResolvedValue({ status: 'expired' }) },
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Get a new code' })).toBeVisible())
    expect(canvas.queryByAltText('QR code to sign in and approve this TV')).toBeNull()
  },
}
