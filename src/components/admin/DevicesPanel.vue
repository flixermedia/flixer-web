<script setup lang="ts">
import { apiKeys, devices } from './mock'
import { useI18n } from 'vue-i18n'
import AdminSection from './AdminSection.vue'
const { t } = useI18n()
</script>

<template>
  <div class="flex flex-col gap-6">
    <AdminSection :title="t('admin.devices.title')" :description="t('admin.devices.description')">
      <div class="overflow-x-auto">
        <table class="w-full min-w-160 text-left text-sm">
          <thead class="text-xs text-flixer-muted">
            <tr>
              <th class="pb-2 font-medium">{{ t('admin.devices.device') }}</th>
              <th class="pb-2 font-medium">{{ t('admin.devices.app') }}</th>
              <th class="pb-2 font-medium">{{ t('admin.devices.user') }}</th>
              <th class="pb-2 font-medium">{{ t('admin.devices.ipAddress') }}</th>
              <th class="pb-2 font-medium">{{ t('admin.devices.lastSeen') }}</th>
              <th class="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in devices" :key="d.id" class="border-t border-flixer-border">
              <td class="py-3 font-medium">{{ d.name }}</td>
              <td class="text-flixer-muted">{{ d.app }}</td>
              <td class="text-flixer-muted">@{{ d.user }}</td>
              <td class="font-mono text-xs text-flixer-muted">{{ d.ip }}</td>
              <td class="text-flixer-muted">{{ d.lastSeen }}</td>
              <td class="text-right">
                <button type="button" class="rounded bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/30">{{ t('admin.devices.signOut') }}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AdminSection>

    <AdminSection :title="t('admin.devices.apiKeysTitle')" :description="t('admin.devices.apiKeysDescription')">
      <template #actions>
        <button type="button" class="rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80">{{ t('admin.devices.newApiKey') }}</button>
      </template>
      <ul class="grid gap-2">
        <li v-for="k in apiKeys" :key="k.id" class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-flixer-border bg-flixer-background/60 px-4 py-3">
          <div>
            <p class="text-sm font-semibold">{{ k.name }}</p>
            <p class="text-xs text-flixer-muted">
              <span class="font-mono">{{ k.prefix }}</span> · {{ t('admin.devices.created') }} {{ k.created }} · {{ t('admin.devices.used') }} {{ k.lastUsed }}
            </p>
          </div>
          <button type="button" class="rounded bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/30">{{ t('admin.devices.revoke') }}</button>
        </li>
      </ul>
    </AdminSection>
  </div>
</template>
