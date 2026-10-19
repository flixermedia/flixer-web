// Prototype data only: nothing in the admin dashboard tabs below is wired to the API yet.

export interface MockLibrary {
  id: string
  name: string
  type: 'Movies' | 'TV Shows' | 'Music' | 'Home Videos'
  paths: string[]
  items: number
  sizeGb: number
  lastScan: string
  scanning: boolean
  scanProgress?: number
  realtimeMonitor: boolean
  metadataLanguage: string
  providers: string[]
}

export const libraries: MockLibrary[] = [
  { id: 'l1', name: 'Movies', type: 'Movies', paths: ['/media/movies'], items: 412, sizeGb: 1840, lastScan: '12 minutes ago', scanning: false, realtimeMonitor: true, metadataLanguage: 'English', providers: ['TMDB', 'OMDb'] },
  { id: 'l2', name: 'TV Shows', type: 'TV Shows', paths: ['/media/tv', '/mnt/nas/tv'], items: 1893, sizeGb: 3120, lastScan: 'Scanning…', scanning: true, scanProgress: 63, realtimeMonitor: true, metadataLanguage: 'English', providers: ['TVDB', 'TMDB'] },
  { id: 'l3', name: 'Anime', type: 'TV Shows', paths: ['/media/anime'], items: 604, sizeGb: 980, lastScan: '3 hours ago', scanning: false, realtimeMonitor: false, metadataLanguage: 'Japanese', providers: ['AniDB', 'TMDB'] },
  { id: 'l4', name: 'Home Videos', type: 'Home Videos', paths: ['/media/home'], items: 87, sizeGb: 64, lastScan: 'Yesterday', scanning: false, realtimeMonitor: false, metadataLanguage: 'English', providers: [] },
]

export interface MockUser {
  id: string
  displayName: string
  username: string
  email: string
  role: 'admin' | 'user'
  status: 'active' | 'disabled' | 'pending'
  lastActive: string
  passkeys: number
  libraries: string
  maxStreams: number
  parental: string
}

export const users: MockUser[] = [
  { id: 'u1', displayName: 'Zep Li', username: 'zepli', email: 'zep@example.com', role: 'admin', status: 'active', lastActive: 'Now', passkeys: 2, libraries: 'All libraries', maxStreams: 0, parental: 'None' },
  { id: 'u2', displayName: 'Alex Morgan', username: 'alexm', email: 'alex@example.com', role: 'user', status: 'active', lastActive: '2 hours ago', passkeys: 1, libraries: 'Movies, TV Shows', maxStreams: 2, parental: 'Up to R' },
  { id: 'u3', displayName: 'Sam Rivera', username: 'samr', email: 'sam@example.com', role: 'user', status: 'active', lastActive: 'Yesterday', passkeys: 0, libraries: 'All libraries', maxStreams: 3, parental: 'None' },
  { id: 'u4', displayName: 'Kids Account', username: 'kids', email: 'family@example.com', role: 'user', status: 'active', lastActive: '3 days ago', passkeys: 0, libraries: 'Movies, Anime', maxStreams: 1, parental: 'Up to PG' },
  { id: 'u5', displayName: 'Jordan Lee', username: 'jordan', email: 'jordan@example.com', role: 'user', status: 'pending', lastActive: 'Never', passkeys: 0, libraries: 'None', maxStreams: 1, parental: 'Up to PG-13' },
  { id: 'u6', displayName: 'Old Guest', username: 'guest', email: 'guest@example.com', role: 'user', status: 'disabled', lastActive: '2 months ago', passkeys: 0, libraries: 'Movies', maxStreams: 1, parental: 'Up to PG-13' },
]

export interface MockDevice {
  id: string
  name: string
  app: string
  user: string
  lastSeen: string
  ip: string
}

export const devices: MockDevice[] = [
  { id: 'd1', name: 'Chrome on Windows', app: 'Flixer Web 0.2.0', user: 'zepli', lastSeen: 'Now', ip: '192.168.1.24' },
  { id: 'd2', name: 'iPhone 15', app: 'Flixer PWA', user: 'alexm', lastSeen: '2 hours ago', ip: '82.14.9.201' },
  { id: 'd3', name: 'Living room TV', app: 'Flixer Web 0.2.0', user: 'samr', lastSeen: 'Yesterday', ip: '192.168.1.40' },
  { id: 'd4', name: 'iPad', app: 'Flixer PWA', user: 'kids', lastSeen: '3 days ago', ip: '192.168.1.61' },
]

export interface MockApiKey {
  id: string
  name: string
  prefix: string
  created: string
  lastUsed: string
}

export const apiKeys: MockApiKey[] = [
  { id: 'k1', name: 'Home Assistant', prefix: 'flx_9f3a…', created: '12 Aug 2026', lastUsed: '5 minutes ago' },
  { id: 'k2', name: 'Request manager', prefix: 'flx_41bc…', created: '2 Sep 2026', lastUsed: 'Yesterday' },
]

export interface MockTask {
  id: string
  name: string
  category: string
  description: string
  trigger: string
  lastRun: string
  lastResult: 'Completed' | 'Failed' | 'Never run'
  running: boolean
  progress?: number
}

export const tasks: MockTask[] = [
  { id: 't1', name: 'Scan media libraries', category: 'Library', description: 'Looks for new, changed and removed files in all libraries.', trigger: 'Every 12 hours', lastRun: '12 minutes ago', lastResult: 'Completed', running: true, progress: 63 },
  { id: 't2', name: 'Refresh metadata', category: 'Library', description: 'Re-downloads artwork and metadata for items missing details.', trigger: 'Weekly, Sunday 03:00', lastRun: '4 days ago', lastResult: 'Completed', running: false },
  { id: 't3', name: 'Generate trickplay thumbnails', category: 'Library', description: 'Creates seek preview images for video files.', trigger: 'Daily, 04:00', lastRun: '17 hours ago', lastResult: 'Completed', running: false },
  { id: 't4', name: 'Clean transcode directory', category: 'Maintenance', description: 'Deletes stale transcode segments older than 24 hours.', trigger: 'Every 6 hours', lastRun: '2 hours ago', lastResult: 'Completed', running: false },
  { id: 't5', name: 'Clean log files', category: 'Maintenance', description: 'Removes log files older than the retention period.', trigger: 'Daily, 02:00', lastRun: '19 hours ago', lastResult: 'Failed', running: false },
  { id: 't6', name: 'Optimise database', category: 'Maintenance', description: 'Compacts and re-indexes the database.', trigger: 'Not scheduled', lastRun: 'Never', lastResult: 'Never run', running: false },
]

export interface MockLogEntry {
  time: string
  level: 'Info' | 'Warn' | 'Error'
  source: string
  message: string
}

export const logs: MockLogEntry[] = [
  { time: '21:28:04', level: 'Info', source: 'streamer', message: 'Started transcode session for "Big Buck Bunny" (H.264 1080p → 720p)' },
  { time: '21:27:41', level: 'Info', source: 'auth', message: 'User alexm signed in with passkey from 82.14.9.201' },
  { time: '21:22:13', level: 'Warn', source: 'library', message: 'Could not match "Unknown.Show.S01E04.mkv" to any metadata provider' },
  { time: '21:15:00', level: 'Info', source: 'tasks', message: 'Scheduled task "Clean transcode directory" completed in 1.2s' },
  { time: '20:58:47', level: 'Error', source: 'tasks', message: 'Scheduled task "Clean log files" failed: EPERM unlink /var/log/flixer/old.log' },
  { time: '20:41:09', level: 'Info', source: 'library', message: 'Realtime monitor detected 3 new files in /media/movies' },
  { time: '20:12:32', level: 'Warn', source: 'auth', message: 'Failed sign-in for "guest" (account disabled) from 203.0.113.9' },
  { time: '19:02:10', level: 'Info', source: 'server', message: 'Flixer server 0.2.0 started' },
]

export interface MockActivity {
  time: string
  user: string
  text: string
}

export const activity: MockActivity[] = [
  { time: '5 min ago', user: 'alexm', text: 'started watching "Big Buck Bunny"' },
  { time: '2 hours ago', user: 'alexm', text: 'signed in from iPhone 15' },
  { time: '3 hours ago', user: 'samr', text: 'finished "Wasteman"' },
  { time: 'Yesterday', user: 'jordan', text: 'registered an account (awaiting approval)' },
  { time: 'Yesterday', user: 'zepli', text: 'added a passkey' },
]

export const serverInfo = {
  name: 'Flixer Home',
  version: '0.2.0',
  streamerVersion: '0.1.0',
  os: 'Windows 11 x64',
  uptime: '2 days, 4 hours',
  ffmpeg: '7.1',
  address: 'https://flixer.example.com',
}

export const stats = {
  movies: 412,
  shows: 186,
  episodes: 1893,
  users: 6,
  storageUsedGb: 6004,
  storageTotalGb: 8000,
}
