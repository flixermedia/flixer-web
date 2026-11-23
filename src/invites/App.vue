<script setup lang="ts">
import { ModalOverlay, ModalTarget } from "@kolirt/vue-modal";
</script>

<template>
	<div class="min-h-screen bg-flixer-background font-sans text-flixer-text selection:bg-flixer-accent selection:text-white">
		<router-view />
		<ModalOverlay />
		<ModalTarget group="default" />
	</div>
</template>
