<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { Checkbox, CheckboxIndicator } from '@ui-sdk/vue/checkbox'
import { computed, onMounted } from 'vue'
import type { NotificationCategoryPreferences } from '../../api'
import { playChime, unlockAudio } from '../../composables/useChat'
import { useNotificationPreferences } from '../../composables/useNotificationPreferences'
import { useNotifications } from '../../composables/useNotifications'

const { preferences, loading, saving, load, setFlag, setCategory } = useNotificationPreferences()
const notifications = useNotifications()

const categories: Array<{ key: keyof NotificationCategoryPreferences; label: string; description: string }> = [
  {
    key: 'message',
    label: 'Chat messages',
    description: 'Inbox and push alerts for unread direct and group chat messages.',
  },
  {
    key: 'new_media',
    label: 'New media arrivals',
    description: 'Notifications when new movies, series, or episodes are added to your libraries.',
  },
  {
    key: 'request',
    label: 'Media requests',
    description: 'Updates when your media requests are approved, available, or declined.',
  },
  {
    key: 'system',
    label: 'Issue & system updates',
    description: 'Replies and status changes on issue reports and account notices.',
  },
  {
    key: 'admin',
    label: 'Server & admin alerts',
    description: 'Administrative alerts such as permission or system warnings.',
  },
]

const pushStatusLabel = computed(() => {
  if (!notifications.enabled.value) return 'Disabled by server administrator'
  if (!notifications.pushSupported) return 'Not supported in this browser'
  if (notifications.permission.value === 'denied') return 'Blocked in browser permissions'
  return notifications.pushEnabled.value ? 'Subscribed on this device' : 'Not subscribed on this device'
})

function testChime() {
  unlockAudio()
  playChime()
}

async function togglePushSubscription() {
  if (notifications.pushEnabled.value) {
    await notifications.disablePush()
  } else {
    await notifications.enablePush()
  }
}

onMounted(() => {
  void load(true)
})
</script>

<template>
  <section aria-labelledby="notifications-settings-heading" class="max-w-2xl space-y-6">
    <div>
      <h2 id="notifications-settings-heading" class="text-lg font-semibold text-white">Notifications</h2>
      <p class="mt-1 text-sm text-flixer-muted">
        Customize chat sounds, floating message toasts, browser push alerts, and notification categories.
      </p>
    </div>

    <!-- Chat & Sound -->
    <div class="space-y-3">
      <div class="flex items-center justify-between gap-3">
        <h3 class="text-xs font-semibold uppercase tracking-wide text-flixer-muted">Chat &amp; Sound</h3>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded border border-flixer-border bg-white/[0.06] px-2.5 py-1 text-xs font-medium text-white transition hover:bg-white/10"
          @click="testChime"
        >
          <Icon icon="lucide:volume-2" class="size-3.5 text-flixer-accent" aria-hidden="true" />
          Test chime
        </button>
      </div>

      <label class="flex cursor-pointer items-start gap-3 rounded border border-flixer-border bg-flixer-surface p-4">
        <Checkbox
          :checked="preferences.chatChime"
          class="mt-1 size-4 shrink-0 rounded-sm data-checked:border-flixer-primary data-checked:bg-flixer-primary"
          :disabled="loading || saving"
          @update:checked="setFlag('chatChime', $event === true)"
        >
          <CheckboxIndicator />
        </Checkbox>
        <span>
          <span class="block text-sm font-medium text-white">Play message chime</span>
          <span class="mt-1 block text-sm text-flixer-muted">
            Play an audible notification chime when someone sends you a new message.
          </span>
        </span>
      </label>

      <label
        class="flex items-start gap-3 rounded border border-flixer-border bg-flixer-surface p-4"
        :class="preferences.chatChime ? 'cursor-pointer' : 'opacity-60'"
      >
        <Checkbox
          :checked="preferences.chatChimeWhileOpen"
          class="mt-1 size-4 shrink-0 rounded-sm data-checked:border-flixer-primary data-checked:bg-flixer-primary"
          :disabled="loading || saving || !preferences.chatChime"
          @update:checked="setFlag('chatChimeWhileOpen', $event === true)"
        >
          <CheckboxIndicator />
        </Checkbox>
        <span>
          <span class="block text-sm font-medium text-white">Play chime while chat is open</span>
          <span class="mt-1 block text-sm text-flixer-muted">
            Keep playing the incoming message chime even when you are actively viewing the conversation.
          </span>
        </span>
      </label>

      <label class="flex cursor-pointer items-start gap-3 rounded border border-flixer-border bg-flixer-surface p-4">
        <Checkbox
          :checked="preferences.chatToasts"
          class="mt-1 size-4 shrink-0 rounded-sm data-checked:border-flixer-primary data-checked:bg-flixer-primary"
          :disabled="loading || saving"
          @update:checked="setFlag('chatToasts', $event === true)"
        >
          <CheckboxIndicator />
        </Checkbox>
        <span>
          <span class="block text-sm font-medium text-white">Show toast for new messages</span>
          <span class="mt-1 block text-sm text-flixer-muted">
            Display a toast banner when a message arrives while you are outside /chat and the floating widget is closed.
          </span>
        </span>
      </label>
    </div>

    <!-- Push Notifications -->
    <div class="space-y-3">
      <h3 class="text-xs font-semibold uppercase tracking-wide text-flixer-muted">Push Delivery</h3>

      <label class="flex cursor-pointer items-start gap-3 rounded border border-flixer-border bg-flixer-surface p-4">
        <Checkbox
          :checked="preferences.pushEnabled"
          class="mt-1 size-4 shrink-0 rounded-sm data-checked:border-flixer-primary data-checked:bg-flixer-primary"
          :disabled="loading || saving"
          @update:checked="setFlag('pushEnabled', $event === true)"
        >
          <CheckboxIndicator />
        </Checkbox>
        <span>
          <span class="block text-sm font-medium text-white">Receive push notifications</span>
          <span class="mt-1 block text-sm text-flixer-muted">
            Allow Flixer to send Web Push notifications to your subscribed devices when you are away.
          </span>
        </span>
      </label>

      <div class="flex flex-wrap items-center justify-between gap-3 rounded border border-flixer-border bg-flixer-surface p-4">
        <div>
          <p class="text-sm font-medium text-white">This browser</p>
          <p class="mt-0.5 text-xs text-flixer-muted">{{ pushStatusLabel }}</p>
        </div>
        <button
          v-if="notifications.enabled.value && notifications.pushSupported && notifications.permission.value !== 'denied'"
          type="button"
          class="rounded border border-flixer-border bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
          :disabled="notifications.pushBusy.value"
          @click="togglePushSubscription"
        >
          {{ notifications.pushEnabled.value ? 'Unsubscribe device' : 'Subscribe device' }}
        </button>
      </div>
    </div>

    <!-- Categories -->
    <div class="space-y-3">
      <h3 class="text-xs font-semibold uppercase tracking-wide text-flixer-muted">Notification Categories</h3>

      <label
        v-for="cat in categories"
        :key="cat.key"
        class="flex cursor-pointer items-start gap-3 rounded border border-flixer-border bg-flixer-surface p-4"
      >
        <Checkbox
          :checked="preferences.categories[cat.key]"
          class="mt-1 size-4 shrink-0 rounded-sm data-checked:border-flixer-primary data-checked:bg-flixer-primary"
          :disabled="loading || saving"
          @update:checked="setCategory(cat.key, $event === true)"
        >
          <CheckboxIndicator />
        </Checkbox>
        <span>
          <span class="block text-sm font-medium text-white">{{ cat.label }}</span>
          <span class="mt-1 block text-sm text-flixer-muted">{{ cat.description }}</span>
        </span>
      </label>
    </div>
  </section>
</template>
