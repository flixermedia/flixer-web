/** Profiles, favorites, playlists, friends, parties, and chat operations. */
import { api } from './client';
export async function getFavorites() {
    return (await api.get('/favorites')).data;
}
export async function getFavoriteIds() {
    return (await api.get('/favorites/ids')).data;
}
export async function addFavorite(itemId) {
    await api.put(`/favorites/${encodeURIComponent(itemId)}`);
}
export async function removeFavorite(itemId) {
    await api.delete(`/favorites/${encodeURIComponent(itemId)}`);
}
export async function getPlaylists() {
    return (await api.get('/playlists')).data;
}
export async function createPlaylist(input) {
    return (await api.post('/playlists', input)).data;
}
export async function getPlaylist(id) {
    return (await api.get(`/playlists/${encodeURIComponent(id)}`)).data;
}
export async function updatePlaylist(id, changes) {
    return (await api.patch(`/playlists/${encodeURIComponent(id)}`, changes)).data;
}
export async function deletePlaylist(id) {
    await api.delete(`/playlists/${encodeURIComponent(id)}`);
}
export async function addPlaylistItem(id, itemId) {
    const request = { itemId };
    return (await api.post(`/playlists/${encodeURIComponent(id)}/items`, request)).data;
}
export async function removePlaylistItem(id, itemId) {
    await api.delete(`/playlists/${encodeURIComponent(id)}/items/${encodeURIComponent(itemId)}`);
}
export async function reorderPlaylist(id, itemIds) {
    const request = { itemIds };
    await api.put(`/playlists/${encodeURIComponent(id)}/order`, request);
}
export async function getPlaylistsContaining(itemId) {
    return (await api.get(`/playlists/containing/${encodeURIComponent(itemId)}`)).data;
}
export async function getProfiles(q) {
    const params = q ? { q } : {};
    return (await api.get('/profiles', { params })).data;
}
export async function getMySocialProfile() {
    return (await api.get('/profiles/me')).data;
}
export async function getSocialProfile(username) {
    return (await api.get(`/profiles/${encodeURIComponent(username)}`)).data;
}
export async function updateMySocialProfile(changes) {
    return (await api.put('/profiles/me', changes)).data;
}
export async function getFriends() {
    return (await api.get('/friends')).data;
}
export async function requestFriend(username) {
    return (await api.post(`/friends/${encodeURIComponent(username)}`)).data;
}
export async function acceptFriend(username) {
    await api.post(`/friends/${encodeURIComponent(username)}/accept`);
}
export async function removeFriend(username) {
    await api.delete(`/friends/${encodeURIComponent(username)}`);
}
export async function createFriendInvite(username, options) {
    return (await api.post(`/friends/invites/${encodeURIComponent(username)}`, options)).data;
}
export async function getFriendInvite(token) {
    return (await api.get(`/friends/invites/${encodeURIComponent(token)}`)).data;
}
export async function acceptFriendInvite(token) {
    return (await api.post(`/friends/invites/${encodeURIComponent(token)}/accept`)).data;
}
export async function reportListening(itemId, state) {
    const request = { itemId, state };
    await api.post('/profiles/me/listening', request);
}
export async function createParty(itemId, visibility) {
    const request = { itemId, visibility };
    return (await api.post('/parties', request)).data;
}
export async function getParty(id) {
    return (await api.get(`/parties/${encodeURIComponent(id)}`)).data;
}
export async function endParty(id) {
    await api.delete(`/parties/${encodeURIComponent(id)}`);
}
export async function getChatConversations() {
    return (await api.get('/chat/conversations')).data;
}
export async function getChatUnread() {
    return (await api.get('/chat/unread')).data.count;
}
export async function startDirectChat(username) {
    const request = { username };
    return (await api.post('/chat/conversations', request)).data;
}
export async function createChatGroup(name, usernames) {
    const request = { name, usernames };
    return (await api.post('/chat/conversations', request)).data;
}
export async function getChatConversation(id) {
    return (await api.get(`/chat/conversations/${encodeURIComponent(id)}`)).data;
}
export async function getChatMessages(id, options = {}) {
    return (await api.get(`/chat/conversations/${encodeURIComponent(id)}/messages`, { params: options })).data;
}
export async function sendChatMessage(id, body) {
    const request = { body };
    return (await api.post(`/chat/conversations/${encodeURIComponent(id)}/messages`, request)).data;
}
export async function markChatRead(id) {
    await api.post(`/chat/conversations/${encodeURIComponent(id)}/read`);
}
export async function renameChatGroup(id, name) {
    const request = { name };
    return (await api.patch(`/chat/conversations/${encodeURIComponent(id)}`, request)).data;
}
export async function addChatMembers(id, usernames) {
    const request = { usernames };
    return (await api.post(`/chat/conversations/${encodeURIComponent(id)}/members`, request)).data;
}
export async function deleteChatConversation(id) {
    await api.delete(`/chat/conversations/${encodeURIComponent(id)}`);
}
export async function removeChatMember(id, username) {
    await api.delete(`/chat/conversations/${encodeURIComponent(id)}/members/${encodeURIComponent(username)}`);
}
