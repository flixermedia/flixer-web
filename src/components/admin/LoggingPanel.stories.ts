import { AxiosHeaders, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, mocked, spyOn, userEvent, waitFor, within } from 'storybook/test'
import { AUTH_INVALID_EVENT } from '../../api'
import { LoggerClient, LoggerRequestError, type LoggerBucket, type LoggerEvent } from '../../api/logger'
import { apiRequest } from '../../api/client'
import LoggingPanel from './LoggingPanel.vue'

const event = (id: string, app: string): LoggerEvent => ({
  event_id: id, time: '2026-01-01T10:00:00Z', ingested_at: '2026-01-01T10:00:00Z',
  level: 'info', app, instance_id: 'node', message: `Event ${id}`, trace_id: 'trace-1',
})

const meta = {
  title: 'Admin/LoggingPanel',
  component: LoggingPanel,
  parameters: { layout: 'fullscreen' },
  beforeEach: () => {
    const storageKey = 'flixer.logger.filters:https://logger.example'
    const previous = localStorage.getItem(storageKey)
    let ownerConfigured = false
    let capacityPolicy = { maxDatabaseBytes: 0, minFreeBytes: 0 }
    let pairingPending = false
    let ownerInvitations: { id: string; expiresAt: string; managementExpiry: string }[] = []
    let ownerCredentials = [{ id: 'd'.repeat(32), expiresAt: '2099-01-01T00:00:00Z' }]
    localStorage.removeItem(storageKey)
    mocked(apiRequest).mockImplementation(async <T>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
      let data: unknown
      switch (config.url) {
        case '/admin/logger/configuration': data = { configured: true, endpoint: 'https://logger.example' }; break
        case '/admin/logger/pairing':
          if (config.method === 'POST') {
            pairingPending = true
            throw new Error('Temporary setup failure')
          }
          if (config.method === 'DELETE') {
            pairingPending = false
            data = { discarded: true }
            break
          }
          data = { pending: pairingPending, endpoint: pairingPending ? 'https://logger.example' : null }
          break
        case '/admin/logger/pairing/retry':
          pairingPending = false
          data = { configured: true, endpoint: 'https://logger.example', managementExpiresAt: '2099-01-01T00:00:00Z' }
          break
        case '/admin/logger/retention':
          data = config.method === 'PUT' ? config.data : { enabled: true, days: 14, severityDays: { error: 30 } }
          break
        case '/admin/logger/ingestion-policy': data = config.method === 'PUT' ? config.data : { eventsPerSecond: 2000, burst: 5000 }; break
        case '/admin/logger/quota': data = { maxBytes: 0, usedBytes: 0 }; break
        case '/admin/logger/owner/configuration':
          if (config.method === 'PUT') {
            if (config.data.ownerToken.startsWith('invalid-')) throw new Error('Rejected test credential')
            ownerConfigured = true
          }
          data = { configured: ownerConfigured }
          break
        case '/admin/logger/owner/capacity':
          data = { filesystem_total_bytes: 10000, filesystem_available_bytes: 8000, database_bytes: 200, compaction_debt_bytes: 50, compactions_in_progress: 1 }
          break
        case '/admin/logger/owner/capacity-policy':
          if (config.method === 'PUT') capacityPolicy = config.data
          data = capacityPolicy
          break
        case '/admin/logger/owner/pairings':
          if (config.method === 'POST') {
            const pairing = { id: 'c'.repeat(32), expiresAt: '2099-01-01T00:00:00Z', managementExpiry: '2099-02-01T00:00:00Z' }
            ownerInvitations = [pairing]
            data = { ...pairing, token: 'p'.repeat(43) }
          } else data = ownerInvitations
          break
        case `/admin/logger/owner/pairings/${'c'.repeat(32)}`:
          ownerInvitations = []
          data = { revoked: true }
          break
        case '/admin/logger/owner/credentials':
          data = ownerCredentials
          break
        case `/admin/logger/owner/credentials/${'d'.repeat(32)}`:
          ownerCredentials = []
          data = { revoked: true }
          break
        case '/admin/logger/health': data = { status: 'ready', exporter: null }; break
        case '/admin/logger/status': data = {
          status: 'ready', last_ingested_at: null, live_subscribers: 0, active_ingestions: 0, active_queries: 0,
          max_ingestions: 4, max_queries: 4,
          retention: { completed_at: '2099-01-01T00:00:00Z', deleted: 500, batch_full: true, failed: false },
        }; break
        case '/admin/logger/credentials': data = [
          { id: 'a'.repeat(32), scope: 'ingest', app: 'flixer', expiresAt: '2099-01-01T00:00:00Z' },
          { id: 'b'.repeat(32), scope: 'ingest', expiresAt: '2099-01-01T00:00:00Z' },
        ]; break
        default: throw new Error(`Unexpected request: ${config.url}`)
      }
      return { data: data as T, status: 200, statusText: 'OK', headers: {}, config: { ...config, headers: new AxiosHeaders() } }
    })
    const spies = [
      spyOn(LoggerClient.prototype, 'recent').mockResolvedValue([event('3', 'api')]),
      spyOn(LoggerClient.prototype, 'search').mockResolvedValue({ events: [], next_cursor: '' }),
      spyOn(LoggerClient.prototype, 'stats').mockResolvedValue([]),
      spyOn(LoggerClient.prototype, 'sources').mockResolvedValue([{ app: 'indexer', source: 'scanner', count: 12 }]),
      spyOn(LoggerClient.prototype, 'errorGroups').mockResolvedValue([]),
      spyOn(LoggerClient.prototype, 'correlation').mockImplementation(async (_field, _value, cursor) =>
        cursor ? { events: [event('1', 'indexer')], next_cursor: '' } : { events: [event('3', 'api'), event('2', 'streamer')], next_cursor: 'older' }),
    ]
    return () => {
      spies.forEach((spy) => spy.mockRestore())
      if (previous === null) localStorage.removeItem(storageKey)
      else localStorage.setItem(storageKey, previous)
    }
  },
} satisfies Meta<typeof LoggingPanel>

export default meta
type Story = StoryObj<typeof meta>

export const PairingRecovery: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText(/deleted 500 events/)).toBeVisible()
    await expect(canvas.getByText(/more expired events may remain/)).toBeVisible()
    const token = await canvas.findByLabelText('One-time pairing token')
    await userEvent.type(canvas.getByLabelText('Deployment ID'), 'tenant')
    await userEvent.type(token, 'p'.repeat(43))
    await userEvent.click(canvas.getByRole('button', { name: 'Pair logger' }))
    await canvas.findByText(/Pairing failed/)
    await expect(token).toHaveValue('')
    await expect(await canvas.findByRole('button', { name: 'Retry pairing setup' })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Retry pairing setup' }))
    await canvas.findByText('Logger paired successfully.')
    await expect(canvas.getByText(/Management credential expires/)).toBeVisible()
    await expect(canvas.queryByRole('button', { name: 'Retry pairing setup' })).not.toBeInTheDocument()
    expect(mocked(apiRequest)).toHaveBeenCalledWith(expect.objectContaining({
      method: 'POST', url: '/admin/logger/pairing', data: { endpoint: 'https://logger.example', deploymentId: 'tenant', pairingToken: 'p'.repeat(43) },
    }))
  },
}

export const DiscardPairing: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(await canvas.findByLabelText('Deployment ID'), 'tenant')
    await userEvent.type(canvas.getByLabelText('One-time pairing token'), 'p'.repeat(43))
    await userEvent.click(canvas.getByRole('button', { name: 'Pair logger' }))
    await userEvent.click(await canvas.findByRole('button', { name: 'Discard pending pairing' }))
    await userEvent.click(await within(document.body).findByRole('button', { name: 'Discard pairing' }))
    await canvas.findByText(/Pending pairing discarded/)
    await expect(canvas.queryByRole('button', { name: 'Retry pairing setup' })).not.toBeInTheDocument()
    await expect(mocked(apiRequest)).toHaveBeenCalledWith(expect.objectContaining({ method: 'DELETE', url: '/admin/logger/pairing' }))
  },
}

export const OwnerPairingInvitation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(await canvas.findByLabelText('Logger-owner credential'), 'owner-test-credential-01234567890123456789')
    await userEvent.click(canvas.getByRole('button', { name: 'Connect owner credential' }))
    await userEvent.type(await canvas.findByLabelText('Invitation deployment ID'), 'other-deployment')
    await userEvent.click(canvas.getByRole('button', { name: 'Create invitation' }))
    await userEvent.click(await within(document.body).findByRole('button', { name: 'Confirm invitation' }))
    const invitation = await canvas.findByLabelText('Invitation token')
    await expect(invitation).toHaveValue('p'.repeat(43))
    await expect(canvas.getByRole('button', { name: 'Create invitation' })).toBeDisabled()
    await userEvent.click(canvas.getByRole('button', { name: 'Dismiss token' }))
    await expect(canvas.queryByLabelText('Invitation token')).not.toBeInTheDocument()
    const invitationRow = (await canvas.findByText('c'.repeat(32))).closest('li')
    if (!invitationRow) throw new Error('Missing invitation row')
    await userEvent.click(within(invitationRow).getByRole('button', { name: 'Revoke' }))
    await userEvent.click(await within(document.body).findByRole('button', { name: 'Revoke' }))
    await canvas.findByText('No pending invitations for this deployment.')
    await expect(mocked(apiRequest)).toHaveBeenCalledWith(expect.objectContaining({
      method: 'DELETE', url: `/admin/logger/owner/pairings/${'c'.repeat(32)}`, params: { deploymentId: 'other-deployment' },
    }))
    await userEvent.click(canvas.getByRole('button', { name: 'List management credentials' }))
    const credentialRow = (await canvas.findByText('d'.repeat(32))).closest('li')
    if (!credentialRow) throw new Error('Missing management credential row')
    await userEvent.click(within(credentialRow).getByRole('button', { name: 'Revoke' }))
    await userEvent.click(await within(document.body).findByRole('button', { name: 'Revoke' }))
    await canvas.findByText('No management credentials for this deployment.')
    await expect(mocked(apiRequest)).toHaveBeenCalledWith(expect.objectContaining({
      method: 'DELETE', url: `/admin/logger/owner/credentials/${'d'.repeat(32)}`, params: { deploymentId: 'other-deployment' },
    }))
  },
}

export const OwnerCapacity: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const credential = await canvas.findByLabelText('Logger-owner credential')
    await userEvent.type(credential, 'owner-test-credential-01234567890123456789')
    await userEvent.click(canvas.getByRole('button', { name: 'Connect owner credential' }))
    const maximum = await canvas.findByLabelText('Maximum Pebble-reported bytes (0 = disabled)')
    await expect(credential).toHaveValue('')
    await expect(canvas.getByText(/Pebble-reported database: 200 bytes/)).toBeVisible()
    await userEvent.clear(maximum)
    await userEvent.type(maximum, '1000')
    const minimum = canvas.getByLabelText('Minimum filesystem free bytes (0 = disabled)')
    await userEvent.clear(minimum)
    await userEvent.type(minimum, '500')
    await userEvent.click(canvas.getByRole('button', { name: 'Save global thresholds' }))
    await userEvent.click(await within(document.body).findByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Save global thresholds' })).toBeEnabled())
    expect(mocked(apiRequest)).not.toHaveBeenCalledWith(expect.objectContaining({ method: 'PUT', url: '/admin/logger/owner/capacity-policy' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Save global thresholds' }))
    await userEvent.click(await within(document.body).findByRole('button', { name: 'Apply global thresholds' }))
    await waitFor(() => expect(mocked(apiRequest)).toHaveBeenCalledWith(expect.objectContaining({
      method: 'PUT', url: '/admin/logger/owner/capacity-policy', data: { maxDatabaseBytes: 1000, minFreeBytes: 500 },
    })))
  },
}

export const OwnerCredentialFailureAndSessionReset: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const credential = await canvas.findByLabelText('Logger-owner credential')
    await userEvent.type(credential, 'invalid-test-credential-01234567890123456789')
    await userEvent.click(canvas.getByRole('button', { name: 'Connect owner credential' }))
    await canvas.findByText('Could not connect the owner credential.')
    await expect(credential).toHaveValue('')
    await userEvent.type(credential, 'pending-test-credential-01234567890123456789')
    window.dispatchEvent(new Event(AUTH_INVALID_EVENT))
    await waitFor(() => expect(canvas.queryByLabelText('Logger-owner credential')).not.toBeInTheDocument())
  },
}

export const RetentionAndCorrelation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('scanner')).toBeVisible()
    await expect(await canvas.findByText('All applications (legacy)')).toBeVisible()
    await expect(canvas.getByText('flixer', { selector: 'span' })).toBeVisible()
    const credentialRate = canvas.getByLabelText('Events per second per credential')
    const credentialBurst = canvas.getByLabelText('Burst events per credential')
    await userEvent.clear(credentialRate)
    await userEvent.type(credentialRate, '10')
    await userEvent.clear(credentialBurst)
    await userEvent.type(credentialBurst, '1000')
    const serviceRate = canvas.getByLabelText('Events per second per service')
    const serviceBurst = canvas.getByLabelText('Burst events per service')
    await userEvent.clear(serviceRate)
    await userEvent.type(serviceRate, '20')
    await userEvent.clear(serviceBurst)
    await userEvent.type(serviceBurst, '1000')
    await userEvent.click(canvas.getByRole('button', { name: 'Save limits' }))
    await userEvent.click(await within(document.body).findByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Save limits' })).toBeEnabled())
    expect(mocked(apiRequest)).not.toHaveBeenCalledWith(expect.objectContaining({ method: 'PUT', url: '/admin/logger/ingestion-policy' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Save limits' }))
    await userEvent.click(await within(document.body).findByRole('button', { name: 'Enable service limits' }))
    await waitFor(() => expect(mocked(apiRequest)).toHaveBeenCalledWith(expect.objectContaining({
      method: 'PUT', url: '/admin/logger/ingestion-policy',
      data: { eventsPerSecond: 2000, burst: 5000, credentialEventsPerSecond: 10, credentialBurst: 1000, serviceEventsPerSecond: 20, serviceBurst: 1000 },
    })))
    const app = canvas.getByLabelText('App', { exact: true })
    await userEvent.type(app, 'flixer')
    await userEvent.type(canvas.getByLabelText('Filter name'), 'API errors')
    await userEvent.click(canvas.getByRole('button', { name: 'Save filter' }))
    await userEvent.clear(app)
    await userEvent.click(canvas.getByRole('button', { name: 'Load filter' }))
    await expect(app).toHaveValue('flixer')
    await userEvent.click(canvas.getByRole('button', { name: 'Delete filter' }))
    await expect(canvas.queryByRole('option', { name: 'API errors' })).not.toBeInTheDocument()
    await userEvent.selectOptions(canvas.getByLabelText('Analytics window'), '168')
    await userEvent.selectOptions(canvas.getByLabelText('Time bucket'), 'day')
    await userEvent.click(canvas.getByRole('button', { name: 'Apply analytics window' }))
    await waitFor(() => expect(LoggerClient.prototype.stats).toHaveBeenCalledTimes(2))
    const statsCall = mocked(LoggerClient.prototype.stats).mock.calls.at(-1)
    if (!statsCall) throw new Error('Missing analytics query')
    await expect(Date.parse(statsCall[1]) - Date.parse(statsCall[0])).toBe(168 * 60 * 60_000)
    await expect(Date.parse(statsCall[1]) % 60_000).toBe(0)
    await canvas.findByText('Showing 168 hours in Day buckets.')
    await userEvent.selectOptions(canvas.getByLabelText('Analytics window'), '1')
    await userEvent.selectOptions(canvas.getByLabelText('Time bucket'), 'minute')
    let resolveOld: ((value: LoggerBucket[]) => void) | undefined
    mocked(LoggerClient.prototype.stats).mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve }))
    await userEvent.click(canvas.getByRole('button', { name: 'Apply analytics window' }))
    await userEvent.selectOptions(canvas.getByLabelText('Analytics window'), '720')
    await expect(canvas.getByLabelText('Time bucket')).toHaveValue('hour')
    await expect(canvas.getByRole('option', { name: 'Minute' })).toBeDisabled()
    await userEvent.click(canvas.getByRole('button', { name: 'Apply analytics window' }))
    await canvas.findByText('Showing 720 hours in Hour buckets.')
    if (!resolveOld) throw new Error('Missing pending analytics query')
    resolveOld([])
    await expect(canvas.getByText('Showing 720 hours in Hour buckets.')).toBeVisible()
    const errorDays = await canvas.findByLabelText('error')
    await expect(errorDays).toHaveValue(30)
    await userEvent.clear(errorDays)
    await userEvent.type(errorDays, '45')
    await userEvent.click(canvas.getByRole('button', { name: 'Save retention' }))
    await waitFor(() => expect(mocked(apiRequest)).toHaveBeenCalledWith(expect.objectContaining({
      method: 'PUT', url: '/admin/logger/retention',
      data: { enabled: true, days: 14, severityDays: { error: 45 } },
    })))
    await userEvent.click(canvas.getByText('Event 3'))
    await userEvent.click(canvas.getByRole('button', { name: 'Inspect trace' }))
    await canvas.findByRole('button', { name: 'Load older events' })
    await userEvent.click(canvas.getByRole('button', { name: 'Load older events' }))
    await waitFor(() => expect(canvas.getByText('Event 1')).toBeVisible())
    const timeline = canvas.getByText('Event 1').closest('ul')
    await expect(timeline?.textContent).toMatch(/Event 1.*Event 2.*Event 3/)
    await userEvent.selectOptions(canvas.getByLabelText('Text match'), 'regex')
    await expect(canvas.getByText(/Go RE2 syntax/)).toBeVisible()
    const textInput = canvas.getByLabelText('Message words')
    const searchForm = textInput.closest('form')
    if (!searchForm) throw new Error('Missing log search form')
    await userEvent.type(textInput, ' ^playback ')
    await userEvent.click(within(searchForm).getByRole('button', { name: 'Search' }))
    await waitFor(() => expect(LoggerClient.prototype.search).toHaveBeenCalledWith(
      expect.objectContaining({ text_mode: 'regex', text: ' ^playback ' }),
    ))
    mocked(LoggerClient.prototype.search).mockRejectedValueOnce(new LoggerRequestError(400))
    await userEvent.click(within(searchForm).getByRole('button', { name: 'Search' }))
    await expect(await canvas.findByText(/Search was rejected. Check the regular expression/)).toBeVisible()
  },
}
