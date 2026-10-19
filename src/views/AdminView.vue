<script setup lang="ts">
import StreamSessionsPanel from '../components/admin/StreamSessionsPanel.vue'
import Header from '../components/header/Header.vue'
import { useSignOut } from '../composables/useSignOut'

const { isSigningOut, signOut } = useSignOut()
</script>

<template>
  <div class="min-h-screen overflow-x-hidden bg-flixer-background font-sans text-flixer-text">
    <Header :links="[]" :is-signing-out="isSigningOut" @logout="signOut" />

    <main class="page-gutter w-full pb-16 pt-28">
      <h1 class="text-3xl font-semibold tracking-tight">Admin Dashboard</h1>
      <p class="mt-2 text-sm text-flixer-muted">Monitor and manage this Flixer server.</p>

      <div class="mt-8 max-w-5xl">
        <StreamSessionsPanel />
      </div>
    </main>
  </div>
</template>
