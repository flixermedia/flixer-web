<script setup lang="ts">
import { onBeforeUnmount, watch } from "vue";
import { useI18n } from "vue-i18n";
import { RouterLink, useRoute } from "vue-router";
import { isActivePath } from "../../composables/homeNav";
import { closeNativeMoreMenu, nativeMoreMenuOpen, nativeMoreTabs } from "../../platform/nativeNavigation";

const { t } = useI18n();
const route = useRoute();

function onKeydown(event: KeyboardEvent) {
	if (event.key === "Escape") closeNativeMoreMenu();
}

watch(nativeMoreMenuOpen, (open) => {
	if (open) document.addEventListener("keydown", onKeydown);
	else document.removeEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
	document.removeEventListener("keydown", onKeydown);
});
</script>

<template>
	<Teleport to="body">
		<Transition enter-active-class="transition-opacity duration-150 ease-out motion-reduce:transition-none" enter-from-class="opacity-0" leave-active-class="transition-opacity duration-100 ease-in motion-reduce:transition-none" leave-to-class="opacity-0">
			<div v-if="nativeMoreMenuOpen" class="fixed inset-0 z-[70]">
				<button type="button" class="absolute inset-0 bg-black/20" :aria-label="t('common.close')" @click="closeNativeMoreMenu" />
				<nav class="native-more-menu absolute flex max-h-[60dvh] w-[calc(100%-2rem)] max-w-md gap-1 overflow-x-auto rounded-[1.75rem] border border-white/25 bg-white/10 p-2 shadow-2xl shadow-black/50 backdrop-blur-2xl" :aria-label="t('home.nav.more')">
					<RouterLink v-for="tab in nativeMoreTabs" :key="tab.to" :to="tab.to" class="flex min-w-16 shrink-0 flex-col items-center justify-center gap-2 rounded-[1.25rem] px-2 py-3 text-center text-xs font-medium text-flixer-muted transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-flixer-accent" :class="isActivePath(route.path, tab.to) ? 'bg-flixer-primary/20 text-white' : ''" :aria-current="isActivePath(route.path, tab.to) ? 'page' : undefined" @click="closeNativeMoreMenu">
						<Icon :icon="tab.icon" class="size-5 shrink-0" :class="isActivePath(route.path, tab.to) ? 'text-flixer-accent' : ''" aria-hidden="true" />
						<span class="max-w-full truncate">{{ tab.label }}</span>
					</RouterLink>
				</nav>
			</div>
		</Transition>
	</Teleport>
</template>

<style scoped>
.native-more-menu {
	bottom: calc(max(var(--cap-native-navigation-bottom, 0px), var(--cap-native-system-tabbar-height, 0px)) + 0.75rem);
	left: max(1rem, env(safe-area-inset-left, 0px));
	right: max(1rem, env(safe-area-inset-right, 0px));
	margin-inline: auto;
}
</style>
