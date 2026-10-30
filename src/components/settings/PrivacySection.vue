<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { acceptFriend, getFriends, getMySocialProfile, removeFriend, updateMySocialProfile, type FriendLists, type Profile } from '../../api'
import { notify } from '../../composables/notify'
import { catchError } from '../../utils/catchError'

const { t } = useI18n()
const visibility = ref<Profile['visibility']>('public')
const ready = ref(false)
const saving = ref(false)
const friends = ref<FriendLists>({ friends: [], incoming: [], outgoing: [] })
const busyUsername = ref('')

getMySocialProfile()
  .then((profile) => {
    visibility.value = profile.visibility
    ready.value = true
  })
  .catch(() => notify.error(t('social.privacyLoadError')))

async function loadFriends() {
  const [error, result] = await catchError(getFriends())
  if (error) {
    notify.error(t('social.friendsLoadError'))
  } else {
    friends.value = result
  }
}
void loadFriends()

async function changeVisibility(event: Event) {
  const next = (event.target as HTMLSelectElement).value as Profile['visibility']
  const previous = visibility.value
  visibility.value = next
  saving.value = true
  try {
    const [error, profile] = await catchError(updateMySocialProfile({ visibility: next }))
    if (error) {
      visibility.value = previous
      notify.error(t('social.saveError'))
    } else {
      visibility.value = profile.visibility
    }
  } finally {
    saving.value = false
  }
}

async function updateFriend(username: string, accept: boolean) {
  busyUsername.value = username
  try {
    const [error] = await catchError(accept ? acceptFriend(username) : removeFriend(username))
    if (error) {
      notify.error(t('social.friendActionFailed'))
      return
    }
    await loadFriends()
  } finally {
    busyUsername.value = ''
  }
}
</script>

<template>
  <section aria-labelledby="privacy-heading">
    <h2 id="privacy-heading" class="text-lg font-semibold">{{ t('social.privacyTitle') }}</h2>
    <p class="mt-1 text-sm text-flixer-muted">{{ t('social.privacyDescription') }}</p>
    <label class="mt-5 block max-w-sm text-sm font-medium text-white" :class="{ 'opacity-60': !ready }">
      <span class="mb-2 block">{{ t('social.profileVisibility') }}</span>
      <select :value="visibility" class="w-full rounded-lg border border-flixer-border bg-flixer-background px-3 py-2.5 text-sm text-white focus-visible:outline-2 focus-visible:outline-flixer-accent" :disabled="!ready || saving" @change="changeVisibility">
        <option value="public">{{ t('social.visibility.public') }}</option>
        <option value="friends">{{ t('social.visibility.friends') }}</option>
        <option value="hidden">{{ t('social.visibility.hidden') }}</option>
      </select>
      <span class="mt-2 block text-xs text-flixer-muted">{{ t(`social.visibilityDescription.${visibility}`) }}</span>
    </label>

    <div class="mt-8 space-y-6">
      <section v-if="friends.incoming.length" aria-labelledby="friend-requests-heading">
        <h3 id="friend-requests-heading" class="text-sm font-semibold">{{ t('social.friendRequests') }}</h3>
        <ul class="mt-2 divide-y divide-white/5 rounded border border-white/10">
          <li v-for="person in friends.incoming" :key="person.id" class="flex items-center justify-between gap-3 p-3">
            <span class="min-w-0 truncate text-sm text-white"
              >{{ person.displayName }} <span class="text-flixer-muted">@{{ person.username }}</span></span
            >
            <span class="flex shrink-0 gap-2">
              <button type="button" class="rounded bg-white px-3 py-1.5 text-xs font-semibold text-flixer-background disabled:opacity-60" :disabled="busyUsername === person.username" @click="updateFriend(person.username, true)">{{ t('social.acceptFriend') }}</button>
              <button type="button" class="rounded bg-white/10 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60" :disabled="busyUsername === person.username" @click="updateFriend(person.username, false)">{{ t('social.declineFriend') }}</button>
            </span>
          </li>
        </ul>
      </section>

      <section v-if="friends.outgoing.length" aria-labelledby="sent-requests-heading">
        <h3 id="sent-requests-heading" class="text-sm font-semibold">{{ t('social.sentFriendRequests') }}</h3>
        <ul class="mt-2 divide-y divide-white/5 rounded border border-white/10">
          <li v-for="person in friends.outgoing" :key="person.id" class="flex items-center justify-between gap-3 p-3">
            <span class="min-w-0 truncate text-sm text-white"
              >{{ person.displayName }} <span class="text-flixer-muted">@{{ person.username }}</span></span
            >
            <button type="button" class="shrink-0 rounded bg-white/10 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60" :disabled="busyUsername === person.username" @click="updateFriend(person.username, false)">{{ t('social.cancelFriendRequest') }}</button>
          </li>
        </ul>
      </section>

      <section v-if="friends.friends.length" aria-labelledby="friends-heading">
        <h3 id="friends-heading" class="text-sm font-semibold">{{ t('social.friends') }} · {{ friends.friends.length }}</h3>
        <ul class="mt-2 divide-y divide-white/5 rounded border border-white/10">
          <li v-for="person in friends.friends" :key="person.id" class="flex items-center justify-between gap-3 p-3">
            <span class="min-w-0 truncate text-sm text-white"
              >{{ person.displayName }} <span class="text-flixer-muted">@{{ person.username }}</span></span
            >
            <button type="button" class="shrink-0 rounded bg-white/10 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60" :disabled="busyUsername === person.username" @click="updateFriend(person.username, false)">{{ t('social.removeFriend') }}</button>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>
