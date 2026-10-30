/** Profiles, favorites, playlists, friends, parties, and chat operations. */
import { api } from './client'
import type {
  ChatConversation,
  ChatMessage,
  FriendInvite,
  FriendLists,
  MySocialProfile,
  PartySnapshot,
  ProfileVisibilityUpdate,
  PlaylistSummary,
  Profile,
  FlixerApiRouteBody,
  FlixerApiRouteData,
  FlixerApiRouteQuery,
} from 'flixer-api-client'
export type {
  ChatConversation,
  ChatMember,
  ChatMessage,
  ChatPerson,
  FriendInvite,
  FriendInviteMode,
  FriendLists,
  FriendPerson,
  MySocialProfile,
  PartyChatMessage,
  PartyPerson,
  PartySnapshot,
  PartySummary,
  PlaylistSummary,
  PlaylistTrack,
  Profile,
  ProfileVisibilityUpdate,
  PublicProfileSummary,
  SocialItem,
  SocialItemType,
} from 'flixer-api-client'

export async function getFavorites(): Promise<FlixerApiRouteData<'get', '/favorites'>> {
  return (await api.get<FlixerApiRouteData<'get', '/favorites'>>('/favorites')).data
}

export async function getFavoriteIds(): Promise<FlixerApiRouteData<'get', '/favorites/ids'>> {
  return (await api.get<FlixerApiRouteData<'get', '/favorites/ids'>>('/favorites/ids')).data
}

export async function addFavorite(itemId: string): Promise<void> {
  await api.put(`/favorites/${encodeURIComponent(itemId)}`)
}

export async function removeFavorite(itemId: string): Promise<void> {
  await api.delete(`/favorites/${encodeURIComponent(itemId)}`)
}

export async function getPlaylists(): Promise<FlixerApiRouteData<'get', '/playlists'>> {
  return (await api.get<FlixerApiRouteData<'get', '/playlists'>>('/playlists')).data
}

export async function createPlaylist(input: FlixerApiRouteBody<'post', '/playlists'>): Promise<PlaylistSummary> {
  return (await api.post<PlaylistSummary>('/playlists', input)).data
}

export async function getPlaylist(id: string): Promise<FlixerApiRouteData<'get', '/playlists/{param}'>> {
  return (await api.get<FlixerApiRouteData<'get', '/playlists/{param}'>>(`/playlists/${encodeURIComponent(id)}`)).data
}

export async function updatePlaylist(id: string, changes: FlixerApiRouteBody<'patch', '/playlists/{param}'>): Promise<PlaylistSummary> {
  return (await api.patch<PlaylistSummary>(`/playlists/${encodeURIComponent(id)}`, changes)).data
}

export async function deletePlaylist(id: string): Promise<void> {
  await api.delete(`/playlists/${encodeURIComponent(id)}`)
}

export async function addPlaylistItem(id: string, itemId: string): Promise<FlixerApiRouteData<'post', '/playlists/{param}/items'>> {
  const request: FlixerApiRouteBody<'post', '/playlists/{param}/items'> = { itemId }
  return (await api.post<FlixerApiRouteData<'post', '/playlists/{param}/items'>>(`/playlists/${encodeURIComponent(id)}/items`, request)).data
}

export async function removePlaylistItem(id: string, itemId: string): Promise<void> {
  await api.delete(`/playlists/${encodeURIComponent(id)}/items/${encodeURIComponent(itemId)}`)
}

export async function reorderPlaylist(id: string, itemIds: string[]): Promise<void> {
  const request: FlixerApiRouteBody<'put', '/playlists/{param}/order'> = { itemIds }
  await api.put(`/playlists/${encodeURIComponent(id)}/order`, request)
}

export async function getPlaylistsContaining(itemId: string): Promise<FlixerApiRouteData<'get', '/playlists/containing/{param}'>> {
  return (await api.get<FlixerApiRouteData<'get', '/playlists/containing/{param}'>>(`/playlists/containing/${encodeURIComponent(itemId)}`)).data
}

export async function getProfiles(q?: string): Promise<FlixerApiRouteData<'get', '/profiles'>> {
  const params: FlixerApiRouteQuery<'get', '/profiles'> = q ? { q } : {}
  return (await api.get<FlixerApiRouteData<'get', '/profiles'>>('/profiles', { params })).data
}

export async function getMySocialProfile(): Promise<MySocialProfile> {
  return (await api.get<MySocialProfile>('/profiles/me')).data
}

export async function getSocialProfile(username: string): Promise<Profile> {
  return (await api.get<Profile>(`/profiles/${encodeURIComponent(username)}`)).data
}

export async function updateMySocialProfile(changes: FlixerApiRouteBody<'put', '/profiles/me'>): Promise<ProfileVisibilityUpdate> {
  return (await api.put<ProfileVisibilityUpdate>('/profiles/me', changes)).data
}

export async function getFriends(): Promise<FriendLists> {
  return (await api.get<FriendLists>('/friends')).data
}

export async function requestFriend(username: string): Promise<FlixerApiRouteData<'post', '/friends/{param}'>> {
  return (await api.post<FlixerApiRouteData<'post', '/friends/{param}'>>(`/friends/${encodeURIComponent(username)}`)).data
}

export async function acceptFriend(username: string): Promise<void> {
  await api.post(`/friends/${encodeURIComponent(username)}/accept`)
}

export async function removeFriend(username: string): Promise<void> {
  await api.delete(`/friends/${encodeURIComponent(username)}`)
}

export async function createFriendInvite(username: string, options: FlixerApiRouteBody<'post', '/friends/invites/{param}'>): Promise<FlixerApiRouteData<'post', '/friends/invites/{param}'>> {
  return (await api.post<FlixerApiRouteData<'post', '/friends/invites/{param}'>>(`/friends/invites/${encodeURIComponent(username)}`, options)).data
}

export async function getFriendInvite(token: string): Promise<FriendInvite> {
  return (await api.get<FriendInvite>(`/friends/invites/${encodeURIComponent(token)}`)).data
}

export async function acceptFriendInvite(token: string): Promise<FlixerApiRouteData<'post', '/friends/invites/{param}/accept'>> {
  return (await api.post<FlixerApiRouteData<'post', '/friends/invites/{param}/accept'>>(`/friends/invites/${encodeURIComponent(token)}/accept`)).data
}

export async function reportListening(itemId: string, state: 'playing' | 'stopped'): Promise<void> {
  const request: FlixerApiRouteBody<'post', '/profiles/me/listening'> = { itemId, state }
  await api.post('/profiles/me/listening', request)
}

export async function createParty(itemId: string, visibility: PartySnapshot['visibility']): Promise<PartySnapshot> {
  const request: FlixerApiRouteBody<'post', '/parties'> = { itemId, visibility }
  return (await api.post<PartySnapshot>('/parties', request)).data
}

export async function getParty(id: string): Promise<PartySnapshot> {
  return (await api.get<PartySnapshot>(`/parties/${encodeURIComponent(id)}`)).data
}

export async function endParty(id: string): Promise<void> {
  await api.delete(`/parties/${encodeURIComponent(id)}`)
}

export async function getChatConversations(): Promise<FlixerApiRouteData<'get', '/chat/conversations'>> {
  return (await api.get<FlixerApiRouteData<'get', '/chat/conversations'>>('/chat/conversations')).data
}

export async function getChatUnread(): Promise<number> {
  return (await api.get<FlixerApiRouteData<'get', '/chat/unread'>>('/chat/unread')).data.count
}

export async function startDirectChat(username: string): Promise<ChatConversation> {
  const request: FlixerApiRouteBody<'post', '/chat/conversations'> = { username }
  return (await api.post<ChatConversation>('/chat/conversations', request)).data
}

export async function createChatGroup(name: string, usernames: string[]): Promise<ChatConversation> {
  const request: FlixerApiRouteBody<'post', '/chat/conversations'> = { name, usernames }
  return (await api.post<ChatConversation>('/chat/conversations', request)).data
}

export async function getChatConversation(id: string): Promise<ChatConversation> {
  return (await api.get<ChatConversation>(`/chat/conversations/${encodeURIComponent(id)}`)).data
}

export async function getChatMessages(id: string, options: FlixerApiRouteQuery<'get', '/chat/conversations/{param}/messages'> = {}): Promise<FlixerApiRouteData<'get', '/chat/conversations/{param}/messages'>> {
  return (await api.get<FlixerApiRouteData<'get', '/chat/conversations/{param}/messages'>>(`/chat/conversations/${encodeURIComponent(id)}/messages`, { params: options })).data
}

export async function sendChatMessage(id: string, body: string): Promise<ChatMessage> {
  const request: FlixerApiRouteBody<'post', '/chat/conversations/{param}/messages'> = { body }
  return (await api.post<ChatMessage>(`/chat/conversations/${encodeURIComponent(id)}/messages`, request)).data
}

export async function markChatRead(id: string): Promise<void> {
  await api.post(`/chat/conversations/${encodeURIComponent(id)}/read`)
}

export async function renameChatGroup(id: string, name: string): Promise<ChatConversation> {
  const request: FlixerApiRouteBody<'patch', '/chat/conversations/{param}'> = { name }
  return (await api.patch<ChatConversation>(`/chat/conversations/${encodeURIComponent(id)}`, request)).data
}

export async function addChatMembers(id: string, usernames: string[]): Promise<ChatConversation> {
  const request: FlixerApiRouteBody<'post', '/chat/conversations/{param}/members'> = { usernames }
  return (await api.post<ChatConversation>(`/chat/conversations/${encodeURIComponent(id)}/members`, request)).data
}

export async function deleteChatConversation(id: string): Promise<void> {
  await api.delete(`/chat/conversations/${encodeURIComponent(id)}`)
}

export async function removeChatMember(id: string, username: string): Promise<void> {
  await api.delete(`/chat/conversations/${encodeURIComponent(id)}/members/${encodeURIComponent(username)}`)
}
