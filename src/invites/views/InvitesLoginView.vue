<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { login, saveAccessToken } from "../../api";
import { notify } from "../../composables/notify";
import { describeRequestError, useProfile } from "../../composables/useProfile";
import { catchError } from "../../utils/catchError";
import TextInput from "../../components/ui/TextInput.vue";
import defaultLogo from "../../../resources/logo/flixer-logo.svg";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { profile, load: loadProfile } = useProfile();

const username = ref("");
const password = ref("");
const isSubmitting = ref(false);

async function handleLogin() {
	if (!username.value.trim() || !password.value) return;
	isSubmitting.value = true;
	try {
		const [error, result] = await catchError(login(username.value.trim(), password.value));
		if (error || !result) {
			notify.error(describeRequestError(error, t("auth.loginFailed") || "Invalid username or password"));
			return;
		}

		const token = "accessToken" in result && typeof result.accessToken === "string"
			? result.accessToken
			: "token" in result && typeof result.token === "string"
			? result.token
			: null;

		if (token) {
			saveAccessToken(token);
			await loadProfile(true);

			if (profile.value?.role !== "admin") {
				notify.error("Access denied: An admin account is required to manage invites.");
				return;
			}

			const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/admin/invites";
			await router.replace(redirect);
		} else if ("passkeyRequired" in result) {
			notify.error("Passkey second-factor is required on this account.");
		} else if ("paymentRequired" in result) {
			notify.error("Subscription or payment is required on this account.");
		} else {
			notify.error("Login could not be completed. Please check your credentials.");
		}
	} finally {
		isSubmitting.value = false;
	}
}
</script>

<template>
	<div class="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6">
		<div class="w-full max-w-md rounded-2xl border border-flixer-border bg-flixer-surface/80 p-8 shadow-2xl backdrop-blur-xl">
			<div class="flex flex-col items-center text-center">
				<img :src="defaultLogo" alt="Flixer" class="h-14 w-14 drop-shadow-md" />
				<h1 class="mt-4 text-2xl font-bold tracking-tight text-white">Flixer Invites</h1>
				<p class="mt-1 text-sm text-flixer-muted">Sign in to manage invites and servers</p>
			</div>

			<form class="mt-8 flex flex-col gap-5" @submit.prevent="handleLogin">
				<TextInput
					v-model="username"
					label="Username or Email"
					name="username"
					type="text"
					required
					autofocus
					autocomplete="username"
					placeholder="admin"
				/>

				<TextInput
					v-model="password"
					label="Password"
					name="password"
					type="password"
					required
					autocomplete="current-password"
					placeholder="••••••••"
				/>

				<button
					type="submit"
					:disabled="isSubmitting || !username.trim() || !password"
					class="mt-2 flex h-11 w-full items-center justify-center rounded-lg bg-flixer-primary text-sm font-semibold text-white shadow-lg shadow-flixer-primary/25 transition hover:bg-flixer-primary/90 focus:outline-none focus:ring-2 focus:ring-flixer-primary focus:ring-offset-2 focus:ring-offset-flixer-surface disabled:cursor-not-allowed disabled:opacity-50"
				>
					<span v-if="!isSubmitting">Sign In</span>
					<span v-else class="flex items-center gap-2">
						<svg class="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
						</svg>
						Signing in…
					</span>
				</button>
			</form>
		</div>
	</div>
</template>
