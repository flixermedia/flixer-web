// Prototype data for admin sections that still need API wiring.

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
