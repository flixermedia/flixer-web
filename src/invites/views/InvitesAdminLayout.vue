<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { clearAccessToken } from "../../api";
import { useProfile } from "../../composables/useProfile";
import defaultLogo from "../../../resources/logo/flixer-logo.svg";
import InvitesPanel from "../../components/admin/InvitesPanel.vue";
import UsersPanel from "../../components/admin/UsersPanel.vue";
import EmailSettingsSection from "../../components/admin/EmailSettingsSection.vue";
import MailAdminPanel from "../../components/admin/MailAdminPanel.vue";
import PaymentSettingsPanel from "../../components/admin/payments/PaymentSettingsPanel.vue";
import PaymentOrdersPanel from "../../components/admin/payments/PaymentOrdersPanel.vue";

const route = useRoute();
const router = useRouter();
const { profile, clear: clearProfile } = useProfile();

const currentTab = computed(() => {
	const path = route.path;
	if (path.startsWith("/admin/users")) return "users";
	if (path.startsWith("/admin/email")) return "email";
	if (path.startsWith("/admin/payments")) return "payments";
	return "invites";
});

const tabs = [
	{ id: "invites", label: "Invitations", path: "/admin/invites", icon: "ticket" },
	{ id: "users", label: "Users", path: "/admin/users", icon: "users" },
	{ id: "email", label: "Email & Verification", path: "/admin/email", icon: "mail" },
	{ id: "payments", label: "Payments", path: "/admin/payments", icon: "credit-card" },
];

function handleSignOut() {
	clearAccessToken(true);
	clearProfile();
	void router.replace("/login");
}
</script>

<template>
	<div class="min-h-screen bg-flixer-background text-flixer-text">
		<!-- Top Bar -->
		<header class="sticky top-0 z-40 border-b border-flixer-border/80 bg-flixer-surface/90 backdrop-blur-md">
			<div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
				<div class="flex items-center gap-6">
					<router-link to="/admin/invites" class="flex items-center gap-2.5">
						<img :src="defaultLogo" alt="Flixer" class="h-8 w-8" />
						<span class="font-bold tracking-tight text-white sm:text-lg">Flixer Invites</span>
						<span class="hidden rounded-full bg-flixer-accent/15 px-2.5 py-0.5 text-xs font-semibold text-flixer-accent sm:inline-block">Standalone</span>
					</router-link>

					<!-- Nav Links -->
					<nav class="hidden md:flex md:items-center md:gap-1">
						<router-link
							v-for="tab in tabs"
							:key="tab.id"
							:to="tab.path"
							class="rounded-lg px-3 py-2 text-sm font-medium transition"
							:class="currentTab === tab.id ? 'bg-white/10 text-white font-semibold' : 'text-flixer-muted hover:bg-white/5 hover:text-flixer-text'"
						>
							{{ tab.label }}
						</router-link>
					</nav>
				</div>

				<div class="flex items-center gap-3">
					<div v-if="profile" class="hidden sm:flex sm:flex-col sm:items-end">
						<span class="text-sm font-semibold text-white">{{ profile.displayName || profile.username }}</span>
						<span class="text-xs text-flixer-muted">{{ profile.email || 'Administrator' }}</span>
					</div>

					<button
						type="button"
						@click="handleSignOut"
						class="flex items-center gap-1.5 rounded-lg border border-flixer-border/60 bg-white/5 px-3 py-1.5 text-xs font-semibold text-flixer-text transition hover:border-flixer-border hover:bg-white/10"
					>
						Sign Out
					</button>
				</div>
			</div>

			<!-- Mobile Nav -->
			<div class="flex border-t border-flixer-border/40 px-2 py-1 md:hidden overflow-x-auto">
				<router-link
					v-for="tab in tabs"
					:key="tab.id"
					:to="tab.path"
					class="shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition"
					:class="currentTab === tab.id ? 'bg-white/10 text-white font-semibold' : 'text-flixer-muted hover:text-flixer-text'"
				>
					{{ tab.label }}
				</router-link>
			</div>
		</header>

		<!-- Content -->
		<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			<div v-if="currentTab === 'invites'">
				<InvitesPanel :standalone="true" />
			</div>

			<div v-else-if="currentTab === 'users'">
				<UsersPanel :standalone="true" />
			</div>

			<div v-else-if="currentTab === 'email'" class="flex flex-col gap-8">
				<EmailSettingsSection />
				<MailAdminPanel screen="templates" />
			</div>

			<div v-else-if="currentTab === 'payments'" class="flex flex-col gap-8">
				<PaymentSettingsPanel />
				<PaymentOrdersPanel />
			</div>
		</main>
	</div>
</template>
