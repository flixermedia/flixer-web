import { api } from './client'

export interface AnalyticsSnapshot {
  video: { id: string; title: string; type: string; viewers: number; completed: number; last_updated: string }[]
  music: { id: string; title: string; plays: string; listeners: number; last_played: string }[]
  orders: { currency: string; status: string; orders: number; total_minor: string; refunded_minor: string }[]
  subscriptions: { status: string; count: number }[]
  advertisements: { total: number; enabled: number }
  adViews: { id: string; name: string; views: number; completed: number; skipped: number; clicked: number; watched_seconds: number }[]
  adTrend: { day: string; views: number; watched_seconds: number }[]
}

export type ViewingTarget = { kind: 'video'; itemId: string } | { kind: 'live'; channelId: string; channelName: string }
export interface ViewingAnalytics {
  video: { id: string; title: string; type: string; sessions: number; viewers: number; watched_seconds: number }[]
  live: { id: string; name: string; sessions: number; viewers: number; watched_seconds: number }[]
  recent: { id: string; viewer: string; title: string; type: string; watched_seconds: number; created_at: string; updated_at: string }[]
  totals: { video_sessions: number; live_sessions: number; watched_seconds: number }
  daily: { day: string; video_sessions: number; live_sessions: number; video_seconds: number; live_seconds: number }[]
}
export interface MusicAnalytics {
  tracks: { id: string; title: string; plays: number; listeners: number }[]
  daily: { day: string; plays: number }[]
}
export interface OrderAnalytics {
  rows: { day: string; kind: string; currency: string; status: string; orders: number; total_minor: string; refunded_minor: string }[]
}

export async function reportViewing(report: ViewingTarget & { id: string; watchedSeconds: number }): Promise<void> {
  await api.post('/analytics/viewing', report)
}

export async function getViewingAnalytics(days: 7 | 30 | 90): Promise<ViewingAnalytics> {
  return (await api.get<ViewingAnalytics>('/admin/analytics/viewing', { params: { days } })).data
}
export async function getMusicAnalytics(days: 7 | 30 | 90): Promise<MusicAnalytics> {
  return (await api.get<MusicAnalytics>('/admin/analytics/music', { params: { days } })).data
}
export async function getOrderAnalytics(days: 7 | 30 | 90): Promise<OrderAnalytics> {
  return (await api.get<OrderAnalytics>('/admin/analytics/orders', { params: { days } })).data
}

export async function reportAdvertisementView(report: { id: string; advertisementId: string; watchedSeconds: number; completed: boolean; skipped: boolean; clicked: boolean }): Promise<void> {
  await api.post('/analytics/advertisement', report)
}

export async function getAnalyticsSnapshot(adDays?: 7 | 30 | 90): Promise<AnalyticsSnapshot> {
  return (await api.get<AnalyticsSnapshot>('/admin/analytics', { params: adDays ? { adDays } : undefined })).data
}
