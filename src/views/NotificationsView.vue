<script setup lang="ts">
import { computed } from "vue";
import Header from "../components/header/Header.vue";
import NotificationBell from "../components/header/NotificationBell.vue";
import { getNavLinks } from "../composables/homeNav";
import { useSignOut } from "../composables/useSignOut.ts";

const links = computed(getNavLinks);
const { isSigningOut, signOut } = useSignOut();
</script>

<template>
	<div class="min-h-screen overflow-x-hidden bg-flixer-background pb-24 font-sans text-flixer-text md:pb-12">
		<Header :links="links" :is-signing-out="isSigningOut" @logout="signOut" />
		<main class="page-gutter mx-auto w-full max-w-3xl pt-24 sm:pt-28">
			<NotificationBell standalone />
		</main>
	</div>
</template>
