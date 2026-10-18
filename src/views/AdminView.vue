<script setup lang="ts">
import Header from '../components/header/Header.vue'
import { useSignOut } from '../composables/useSignOut'

const { isSigningOut, signOut } = useSignOut()
</script>

<template>
  <div class="min-h-screen overflow-x-hidden bg-flixer-background font-sans text-flixer-text">
    <Header :links="[]" :is-signing-out="isSigningOut" @logout="signOut" />

    <main class="page-gutter w-full pb-16 pt-28">
      <h1 class="text-3xl font-semibold tracking-tight">Admin Dashboard</h1>
      <p class="mt-2 text-sm text-flixer-muted">Server administration will live here.</p>
    </main>
  </div>
</template>
