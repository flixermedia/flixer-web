<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminSection from './AdminSection.vue'
import AdminToggle from './AdminToggle.vue'
import { users } from './mock'
import StatusPill from './StatusPill.vue'
import UserAvatar from '../ui/UserAvatar.vue'

const { t } = useI18n()
const query = ref('')
const selectedId = ref<string | null>(null)
const filtered = computed(() => users.filter((u) => `${u.displayName} ${u.username} ${u.email}`.toLowerCase().includes(query.value.toLowerCase())))
const tone = { active: 'good', pending: 'warn', disabled: 'bad' } as const
const statusKeys = { active: 'admin.users.statuses.active', pending: 'admin.users.statuses.pending', disabled: 'admin.users.statuses.disabled' }
</script>

<template>
  <div class="flex flex-col gap-6">
    <AdminSection :title="t('admin.users.title')" :description="t('admin.users.description')">
      <template #actions>
        <input v-model="query" type="search" :placeholder="t('admin.users.searchPlaceholder')" class="rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm" />
        <button type="button" class="rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15">{{ t('admin.users.invite') }}</button>
        <button type="button" class="rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80">{{ t('admin.users.addUser') }}</button>
      </template>

      <div class="overflow-x-auto">
        <table class="w-full min-w-160 text-left text-sm">
          <thead class="text-xs text-flixer-muted">
            <tr>
              <th class="pb-2 font-medium">{{ t('admin.users.user') }}</th>
              <th class="pb-2 font-medium">{{ t('admin.users.role') }}</th>
              <th class="pb-2 font-medium">{{ t('admin.users.status') }}</th>
              <th class="pb-2 font-medium">{{ t('admin.users.passkeys') }}</th>
              <th class="pb-2 font-medium">{{ t('admin.users.lastActive') }}</th>
              <th class="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in filtered" :key="u.id" class="border-t border-flixer-border">
              <td class="py-3">
                <div class="flex items-center gap-3">
                  <div class="size-8 shrink-0 overflow-hidden rounded-full text-xs"><UserAvatar :avatar-url="null" :name="u.displayName" /></div>
                  <div>
                    <p class="font-medium">{{ u.displayName }}</p>
                    <p class="text-xs text-flixer-muted">@{{ u.username }} · {{ u.email }}</p>
                  </div>
                </div>
              </td>
              <td>
                <StatusPill :tone="u.role === 'admin' ? 'accent' : 'neutral'">{{ u.role === 'admin' ? t('admin.users.administrator') : t('admin.users.user') }}</StatusPill>
              </td>
              <td>
                <StatusPill :tone="tone[u.status]">{{ t(statusKeys[u.status]) }}</StatusPill>
              </td>
              <td class="text-flixer-muted">{{ u.passkeys }}</td>
              <td class="text-flixer-muted">{{ u.lastActive }}</td>
              <td class="text-right">
                <button type="button" class="rounded bg-white/10 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/15" @click="selectedId = selectedId === u.id ? null : u.id">{{ selectedId === u.id ? t('admin.users.close') : t('admin.users.edit') }}</button>
              </td>
            </tr>
            <tr v-if="filtered.length === 0">
              <td colspan="6" class="py-6 text-center text-flixer-muted">{{ t('admin.users.noSearchMatches') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </AdminSection>

    <template v-for="u in users" :key="u.id">
      <AdminSection v-if="selectedId === u.id" :title="t('admin.users.editTitle', { name: u.displayName })" :description="t('admin.users.editDescription')">
        <div class="grid gap-6 md:grid-cols-2">
          <div>
            <p class="text-xs font-semibold text-flixer-muted">{{ t('admin.users.access') }}</p>
            <AdminToggle :model-value="u.role === 'admin'" :label="t('admin.users.administrator')" :description="t('admin.users.fullDashboardAccess')" />
            <AdminToggle :model-value="u.status !== 'disabled'" :label="t('admin.users.accountEnabled')" />
            <AdminToggle :model-value="true" :label="t('admin.users.allowMediaDownloads')" />
            <AdminToggle :model-value="u.maxStreams !== 1" :label="t('admin.users.allowTranscoding')" />
            <label class="mt-2 block text-xs text-flixer-muted">
              {{ t('admin.users.libraries') }}
              <input class="mt-1 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-flixer-text" :value="u.libraries" />
            </label>
          </div>
          <div>
            <p class="text-xs font-semibold text-flixer-muted">{{ t('admin.users.restrictions') }}</p>
            <label class="mt-2 block text-xs text-flixer-muted">
              {{ t('admin.users.maximumContentRating') }}
              <input class="mt-1 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-flixer-text" :value="u.parental" />
            </label>
            <label class="mt-3 block text-xs text-flixer-muted">
              {{ t('admin.users.simultaneousStreams') }}
              <input type="number" class="mt-1 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm text-flixer-text" :value="u.maxStreams" />
            </label>
            <div class="mt-5 flex flex-wrap gap-2">
              <button type="button" class="rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15">{{ t('admin.users.sendPasswordReset') }}</button>
              <button type="button" class="rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15">{{ t('admin.users.revokeSessions') }}</button>
              <button type="button" class="rounded bg-red-500/20 px-4 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/30">{{ t('admin.users.deleteUser') }}</button>
            </div>
          </div>
        </div>
        <div class="mt-5 flex justify-end gap-2">
          <button type="button" class="rounded bg-white/10 px-4 py-1.5 text-xs font-semibold transition hover:bg-white/15" @click="selectedId = null">{{ t('common.cancel') }}</button>
          <button type="button" class="rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80">{{ t('common.save') }}</button>
        </div>
      </AdminSection>
    </template>

    <AdminSection :title="t('admin.users.signUpPolicy')" :description="t('admin.users.signUpPolicyDescription')">
      <AdminToggle :model-value="true" :label="t('admin.users.allowPublicRegistration')" :description="t('admin.users.publicRegistrationDescription')" />
      <AdminToggle :model-value="true" :label="t('admin.users.requireAdminApproval')" :description="t('admin.users.adminApprovalDescription')" />
      <AdminToggle :model-value="true" :label="t('admin.users.requireEmailVerification')" />
      <AdminToggle :model-value="false" :label="t('admin.users.requireAdminPasskeys')" />
    </AdminSection>
  </div>
</template>
