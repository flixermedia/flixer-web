<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import logo from "../../resources/logo/flixer-logo.svg";
import AuthField from "../components/auth/AuthField.vue";
import SignupPaymentStep from "../components/payments/SignupPaymentStep.vue";
import { acceptInvite, acceptPlexInvite, getInvite, loginInvite, pollPlexInviteAuth, resendInviteVerification, saveAccessToken, startPlexInviteAuth, type AuthResult, type InviteDestination, type InviteRedemptionResult, type InviteVerificationPending, type PlexInviteAccount, type PublicInvite } from "../api";
import { notify } from "../composables/notify";
import { describeRequestError } from "../composables/useProfile";
import { useProfile } from "../composables/useProfile";
import { catchError } from "../utils/catchError";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const code = computed(() => String(route.params.code ?? ""));
const step = ref<"loading" | "invalid" | "form" | "login" | "payment" | "verification" | "done">("loading");
const invite = ref<PublicInvite | null>(null);
const destination = ref<InviteDestination | null>(null);
const invalidMessage = ref("");
const verificationEmail = ref("");
const verificationResendToken = ref("");
const isResendingVerification = ref(false);
const paymentToken = ref("");

const username = ref("");
const displayName = ref("");
const email = ref("");
const password = ref("");
const isPasswordVisible = ref(false);
const isSubmitting = ref(false);

const loginUsername = ref("");
const loginPassword = ref("");
const isLoginPasswordVisible = ref(false);
const loginNotice = ref("");

// Plex OAuth PIN popup state (Wizarr-style flow).
const plexState = ref<"idle" | "starting" | "waiting" | "connected">("idle");
const plexAuthUrl = ref("");
const plexAuthTicket = ref("");
const plexAccount = ref<PlexInviteAccount | null>(null);
let plexPollTimer: ReturnType<typeof setTimeout> | null = null;
let plexPopup: Window | null = null;
let plexPollGeneration = 0;

// Mirrors LoginView so an interrupted payment survives reloads on both the invite page and the sign-in page.
const PENDING_PAYMENT_KEY = "flixer.pendingPayment";

interface StoredPendingPayment {
	token: string;
	name: string;
	email: string;
	inviteCode?: string;
	destination?: InviteDestination | null;
}

function readPendingPaymentForInvite(inviteCode: string): StoredPendingPayment | null {
	try {
		const raw = localStorage.getItem(PENDING_PAYMENT_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as Partial<StoredPendingPayment> | null;
		if (!parsed || typeof parsed.token !== "string" || !parsed.token) return null;
		if (typeof parsed.inviteCode !== "string" || parsed.inviteCode.toUpperCase() !== inviteCode.toUpperCase()) return null;
		return {
			token: parsed.token,
			name: String(parsed.name ?? ""),
			email: String(parsed.email ?? ""),
			inviteCode: parsed.inviteCode,
			destination: parsed.destination ?? null,
		};
	} catch {
		return null;
	}
}

function savePendingPayment(token: string, name: string, accountEmail: string, target: InviteDestination | null) {
	const entry: StoredPendingPayment = {
		token,
		name,
		email: accountEmail,
		inviteCode: code.value.toUpperCase(),
		destination: target,
	};
	localStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(entry));
}

function clearPendingPayment() {
	localStorage.removeItem(PENDING_PAYMENT_KEY);
}

const isPlexInvite = computed(() => invite.value?.destination.type === "plex");
const isClaimed = computed(() => invite.value?.usesRemaining === 0);

const destinationName = computed(() => {
	const target = destination.value ?? (invite.value ? { ...invite.value.destination, url: null, instructions: null, invitedByEmail: false } : null);
	return target && target.type !== "flixer" ? (target.name ?? t(`admin.invites.types.${target.type}`)) : t("admin.invites.types.flixer");
});

const destinationUrl = computed(() => {
	const target = destination.value;
	if (!target || target.type === "flixer") return null;
	return target.url?.trim() || (target.type === "plex" ? "https://app.plex.tv" : null);
});

const plexCloudUrl = computed(() => {
	const target = destination.value;
	if (!target || target.type !== "plex") return null;
	const current = destinationUrl.value ?? "";
	return /^https?:\/\/app\.plex\.tv(\/|$)/i.test(current) ? null : "https://app.plex.tv";
});

function stopPlexPolling(closePopup = false) {
	plexPollGeneration += 1;
	if (plexPollTimer) {
		clearTimeout(plexPollTimer);
		plexPollTimer = null;
	}
	if (closePopup && plexPopup && !plexPopup.closed) {
		plexPopup.close();
	}
	if (closePopup) {
		plexPopup = null;
	}
}

function resetPlexAuth() {
	stopPlexPolling(true);
	plexState.value = "idle";
	plexAuthUrl.value = "";
	plexAuthTicket.value = "";
	plexAccount.value = null;
}

async function beginPlexSignIn() {
	if (plexState.value === "starting") return;
	stopPlexPolling(true);
	plexState.value = "starting";
	plexAuthUrl.value = "";

	// Open popup synchronously inside the click gesture so browsers don't block it.
	const popup = window.open("", "flixer-plex-auth", "width=600,height=720,menubar=no,toolbar=no,location=yes,status=no");
	plexPopup = popup;

	const [error, started] = await catchError(startPlexInviteAuth(code.value));
	if (error) {
		if (popup && !popup.closed) popup.close();
		plexPopup = null;
		plexState.value = "idle";
		notify.error(describeRequestError(error, t("invite.plex.startFailed")));
		return;
	}

	plexAuthUrl.value = started.authUrl;
	if (popup && !popup.closed) {
		popup.location.href = started.authUrl;
		popup.focus();
	}
	plexState.value = "waiting";

	const generation = ++plexPollGeneration;
	const poll = async () => {
		if (generation !== plexPollGeneration) return;
		const [pollError, result] = await catchError(pollPlexInviteAuth(code.value, started.sessionToken));
		if (generation !== plexPollGeneration) return;
		if (pollError) {
			stopPlexPolling(false);
			plexState.value = "idle";
			notify.error(describeRequestError(pollError, t("invite.plex.pollFailed")));
			return;
		}
		if (result.status === "expired") {
			stopPlexPolling(true);
			plexState.value = "idle";
			notify.error(t("invite.plex.expired"));
			return;
		}
		if (result.status === "authenticated") {
			stopPlexPolling(true);
			plexAuthTicket.value = result.plexAuthTicket;
			plexAccount.value = result.account;
			username.value = result.account.username;
			email.value = result.account.email;
			displayName.value = result.account.displayName;
			plexState.value = "connected";
			return;
		}
		plexPollTimer = setTimeout(() => void poll(), 1500);
	};
	plexPollTimer = setTimeout(() => void poll(), 1500);
}

function handleRedemptionResult(result: InviteRedemptionResult, identity: { name: string; email: string }) {
	destination.value = result.destination;
	if ("accountExists" in result) {
		loginUsername.value = username.value || email.value;
		loginPassword.value = "";
		loginNotice.value = t("invite.accountExistsNotice");
		step.value = "login";
		return;
	}
	if ("paymentRequired" in result) {
		paymentToken.value = result.token;
		savePendingPayment(result.token, identity.name, identity.email, result.destination);
		step.value = "payment";
		return;
	}
	clearPendingPayment();
	finish(result);
}

async function submitPlex() {
	if (!plexAuthTicket.value || isSubmitting.value) return;
	isSubmitting.value = true;
	const [error, result] = await catchError(acceptPlexInvite(code.value, plexAuthTicket.value));
	isSubmitting.value = false;
	if (error) {
		notify.error(describeRequestError(error, t("invite.acceptFailed")));
		return;
	}
	handleRedemptionResult(result, {
		name: plexAccount.value?.username ?? username.value,
		email: plexAccount.value?.email ?? email.value,
	});
}

onMounted(async () => {
	const savedPayment = readPendingPaymentForInvite(code.value);
	const [error, loaded] = await catchError(getInvite(code.value));
	if (!error) {
		invite.value = loaded;
	}

	if (savedPayment) {
		paymentToken.value = savedPayment.token;
		username.value = savedPayment.name;
		email.value = savedPayment.email;
		if (savedPayment.destination) {
			destination.value = savedPayment.destination;
		}
		step.value = "payment";
		return;
	}

	if (error) {
		invalidMessage.value = describeRequestError(error, t("invite.invalid"));
		step.value = "invalid";
		return;
	}

	if (loaded.usesRemaining === 0 && loaded.destination.type !== "plex") {
		loginNotice.value = t("invite.claimedNotice");
		step.value = "login";
		return;
	}
	step.value = "form";
});

onBeforeUnmount(() => {
	stopPlexPolling(false);
});

async function submit() {
	isSubmitting.value = true;
	const [error, result] = await catchError(
		acceptInvite(code.value, {
			username: username.value,
			password: password.value,
			email: email.value,
			displayName: displayName.value.trim() || undefined,
		}),
	);
	isSubmitting.value = false;
	if (error) {
		notify.error(describeRequestError(error, t("invite.acceptFailed")));
		return;
	}
	handleRedemptionResult(result, { name: username.value, email: email.value });
}

function openLoginStep() {
	loginUsername.value = username.value || email.value;
	loginPassword.value = "";
	loginNotice.value = "";
	step.value = "login";
}

async function submitLogin() {
	if (isSubmitting.value) return;
	isSubmitting.value = true;
	const [error, result] = await catchError(
		loginInvite(code.value, {
			username: loginUsername.value,
			password: loginPassword.value,
		}),
	);
	isSubmitting.value = false;
	if (error) {
		notify.error(describeRequestError(error, t("invite.loginFailed")));
		return;
	}
	username.value = loginUsername.value;
	handleRedemptionResult(result, { name: loginUsername.value, email: email.value });
}

async function resendVerification() {
	if (!verificationResendToken.value || isResendingVerification.value) return;
	isResendingVerification.value = true;
	const [error] = await catchError(resendInviteVerification(code.value, verificationResendToken.value));
	isResendingVerification.value = false;
	if (error) {
		notify.error(describeRequestError(error, t("invite.resendFailed")));
		return;
	}
	notify.success(t("invite.verificationResent"));
}

function handlePaid(result: (AuthResult | InviteVerificationPending) & { destination?: InviteDestination }) {
	clearPendingPayment();
	if (result.destination) {
		destination.value = result.destination;
	}
	finish(result);
}

function handlePaymentBack() {
	clearPendingPayment();
	step.value = isClaimed.value && !isPlexInvite.value ? "login" : "form";
}

function handlePaymentExpired() {
	clearPendingPayment();
	notify.error(t("payments.signup.expired"));
	if (!invite.value) {
		void router.push({ name: "login" });
		return;
	}
	if (isPlexInvite.value) {
		resetPlexAuth();
		step.value = "form";
		return;
	}
	loginUsername.value = username.value || email.value;
	loginPassword.value = "";
	loginNotice.value = "";
	step.value = "login";
}

function finish(result: AuthResult | InviteVerificationPending) {
	if ("verificationRequired" in result) {
		verificationEmail.value = result.email;
		verificationResendToken.value = result.resendToken ?? "";
		step.value = "verification";
		return;
	}
	useProfile().clear();
	saveAccessToken(result.accessToken);
	step.value = "done";
}

function enterFlixer() {
	void router.replace("/");
}
</script>

<template>
	<main class="grid min-h-screen place-items-center bg-flixer-background px-6 py-10 font-sans text-flixer-text">
		<div class="w-full max-w-md rounded border border-flixer-border/70 bg-flixer-surface/70 p-8 shadow-2xl">
			<img :src="logo" alt="" class="mx-auto size-14 rounded shadow-lg" aria-hidden="true" />

			<template v-if="step === 'loading'">
				<h1 class="mt-6 text-center text-2xl font-semibold tracking-tight">{{ t("invite.checking") }}</h1>
			</template>

			<template v-else-if="step === 'invalid'">
				<h1 class="mt-6 text-center text-2xl font-semibold tracking-tight">{{ t("invite.invalidTitle") }}</h1>
				<p class="mt-3 text-center text-sm text-flixer-muted">{{ invalidMessage }}</p>
			</template>

			<template v-else-if="step === 'form'">
				<span class="mt-6 block text-center text-[9px] font-bold tracking-[0.2em] text-flixer-accent">{{ t("invite.badge") }}</span>
				<h1 class="mt-2 text-center text-2xl font-semibold tracking-tight">
					{{ invite?.label || t("invite.title", { name: destinationName }) }}
				</h1>
				<p class="mt-2 text-center text-sm text-flixer-muted">
					{{ isPlexInvite ? t("invite.plex.description", { name: destinationName }) : t("invite.description", { name: destinationName }) }}
				</p>
				<p v-if="isClaimed" class="mt-2 text-center text-xs text-flixer-accent">{{ t("invite.claimedNotice") }}</p>
				<p v-else-if="invite?.paymentRequired" class="mt-2 text-center text-xs text-flixer-muted">{{ t("invite.paymentNote") }}</p>

				<div v-if="isPlexInvite" class="mt-6 flex flex-col gap-4">
					<template v-if="plexState === 'idle' || plexState === 'starting'">
						<button type="button" class="flex h-12 items-center justify-center gap-2 rounded bg-[#e5a00d] text-sm font-semibold text-[#18181b] shadow-lg transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60" :disabled="plexState === 'starting'" :aria-busy="plexState === 'starting'" @click="beginPlexSignIn">
							<span v-if="plexState === 'starting'" class="size-4 animate-spin rounded-full border-2 border-[#18181b]/40 border-t-[#18181b]" aria-hidden="true"></span>
							<Icon v-else icon="lucide:external-link" class="size-4" aria-hidden="true" />
							<span>{{ plexState === "starting" ? t("invite.plex.opening") : t("invite.plex.signInButton") }}</span>
						</button>
						<p class="text-center text-xs text-flixer-muted">{{ t("invite.plex.accountHint") }}</p>
					</template>

					<template v-else-if="plexState === 'waiting'">
						<div class="rounded border border-flixer-border bg-flixer-background/60 p-4 text-center">
							<span class="mx-auto block size-6 animate-spin rounded-full border-2 border-white/20 border-t-[#e5a00d]" aria-hidden="true"></span>
							<p class="mt-3 text-sm font-medium">{{ t("invite.plex.waitingTitle") }}</p>
							<p class="mt-1 text-xs text-flixer-muted">{{ t("invite.plex.waitingDescription") }}</p>
						</div>
						<a v-if="plexAuthUrl" :href="plexAuthUrl" target="_blank" rel="noopener noreferrer" class="flex h-11 items-center justify-center gap-2 rounded bg-[#e5a00d] text-sm font-semibold text-[#18181b] transition hover:brightness-110">
							<Icon icon="lucide:external-link" class="size-4" aria-hidden="true" />
							<span>{{ t("invite.plex.reopenWindow") }}</span>
						</a>
						<button type="button" class="flex h-10 items-center justify-center rounded border border-flixer-border text-xs font-semibold text-flixer-muted transition hover:bg-white/5 hover:text-flixer-text" @click="resetPlexAuth">
							{{ t("common.cancel") }}
						</button>
					</template>

					<template v-else-if="plexState === 'connected' && plexAccount">
						<div class="flex items-center gap-3 rounded border border-flixer-border bg-flixer-background/60 p-3">
							<img v-if="plexAccount.avatarUrl" :src="plexAccount.avatarUrl" alt="" class="size-10 shrink-0 rounded-full object-cover" />
							<div v-else class="grid size-10 shrink-0 place-items-center rounded-full bg-[#e5a00d]/20 text-sm font-bold text-[#e5a00d]">
								{{ plexAccount.displayName.slice(0, 1).toUpperCase() }}
							</div>
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-semibold">{{ plexAccount.displayName }}</p>
								<p class="truncate text-xs text-flixer-muted">{{ plexAccount.email }}</p>
							</div>
							<button type="button" class="shrink-0 text-xs font-semibold text-flixer-accent hover:underline" :disabled="isSubmitting" @click="resetPlexAuth">
								{{ t("invite.plex.switchAccount") }}
							</button>
						</div>

						<button type="button" class="flex h-12 items-center justify-center gap-2 rounded bg-gradient-to-r from-flixer-primary to-flixer-secondary text-sm font-semibold text-white shadow-lg shadow-flixer-primary/20 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60" :disabled="isSubmitting" :aria-busy="isSubmitting" @click="submitPlex">
							<span>{{ isSubmitting ? t("auth.creatingAccount") : invite?.paymentRequired ? t("payments.signup.continue") : t("invite.accept") }}</span>
							<span v-if="isSubmitting" class="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true"></span>
						</button>
					</template>
				</div>

				<form v-else class="mt-6 flex flex-col gap-4" @submit.prevent="submit">
					<AuthField id="invite-display-name" :label="t('auth.displayName')">
						<input id="invite-display-name" v-model="displayName" type="text" name="displayName" autocomplete="nickname" maxlength="64" class="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-flixer-text outline-none placeholder:text-flixer-muted/70" />
					</AuthField>
					<AuthField id="invite-username" :label="t('auth.username')">
						<input id="invite-username" v-model.trim="username" type="text" name="username" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" minlength="3" maxlength="64" pattern="[a-zA-Z0-9_.\-]+" required class="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-flixer-text outline-none placeholder:text-flixer-muted/70" />
					</AuthField>
					<AuthField id="invite-email" :label="t('auth.email')">
						<input id="invite-email" v-model.trim="email" type="email" name="email" autocomplete="email" autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="254" required class="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-flixer-text outline-none placeholder:text-flixer-muted/70" />
					</AuthField>
					<AuthField id="invite-password" :label="t('auth.password')">
						<input id="invite-password" v-model="password" :type="isPasswordVisible ? 'text' : 'password'" name="password" :placeholder="t('auth.passwordMinimumPlaceholder')" autocomplete="new-password" minlength="8" maxlength="128" required class="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-flixer-text outline-none placeholder:text-flixer-muted/70" />
						<template #trailing>
							<button class="grid size-11 shrink-0 place-items-center rounded-r-lg text-flixer-muted transition hover:text-flixer-accent" type="button" :aria-label="isPasswordVisible ? t('auth.hidePassword') : t('auth.showPassword')" @click="isPasswordVisible = !isPasswordVisible">
								<Icon :icon="isPasswordVisible ? 'lucide:eye-off' : 'lucide:eye'" class="size-[18px]" aria-hidden="true" />
							</button>
						</template>
					</AuthField>

					<button class="mt-2 flex h-12 items-center justify-center gap-2 rounded bg-gradient-to-r from-flixer-primary to-flixer-secondary text-sm font-semibold text-white shadow-lg shadow-flixer-primary/20 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60" type="submit" :disabled="isSubmitting" :aria-busy="isSubmitting">
						<span>{{ isSubmitting ? t("auth.creatingAccount") : invite?.paymentRequired ? t("payments.signup.continue") : t("invite.accept") }}</span>
						<span v-if="isSubmitting" class="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true"></span>
					</button>

					<button type="button" class="text-center text-xs font-semibold text-flixer-accent underline-offset-2 hover:underline" @click="openLoginStep">
						{{ t("invite.alreadyHaveAccount") }}
					</button>
				</form>
			</template>

			<template v-else-if="step === 'login'">
				<span class="mt-6 block text-center text-[9px] font-bold tracking-[0.2em] text-flixer-accent">{{ t("invite.badge") }}</span>
				<h1 class="mt-2 text-center text-2xl font-semibold tracking-tight">{{ t("invite.loginTitle") }}</h1>
				<p class="mt-2 text-center text-sm text-flixer-muted">{{ loginNotice || t("invite.loginDescription", { name: destinationName }) }}</p>

				<form class="mt-6 flex flex-col gap-4" @submit.prevent="submitLogin">
					<AuthField id="invite-login-username" :label="t('invite.loginIdentifier')">
						<input id="invite-login-username" v-model.trim="loginUsername" type="text" name="username" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="254" required class="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-flixer-text outline-none placeholder:text-flixer-muted/70" />
					</AuthField>
					<AuthField id="invite-login-password" :label="t('auth.password')">
						<input id="invite-login-password" v-model="loginPassword" :type="isLoginPasswordVisible ? 'text' : 'password'" name="password" autocomplete="current-password" maxlength="128" required class="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-flixer-text outline-none placeholder:text-flixer-muted/70" />
						<template #trailing>
							<button class="grid size-11 shrink-0 place-items-center rounded-r-lg text-flixer-muted transition hover:text-flixer-accent" type="button" :aria-label="isLoginPasswordVisible ? t('auth.hidePassword') : t('auth.showPassword')" @click="isLoginPasswordVisible = !isLoginPasswordVisible">
								<Icon :icon="isLoginPasswordVisible ? 'lucide:eye-off' : 'lucide:eye'" class="size-[18px]" aria-hidden="true" />
							</button>
						</template>
					</AuthField>

					<button class="mt-2 flex h-12 items-center justify-center gap-2 rounded bg-gradient-to-r from-flixer-primary to-flixer-secondary text-sm font-semibold text-white shadow-lg shadow-flixer-primary/20 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60" type="submit" :disabled="isSubmitting" :aria-busy="isSubmitting">
						<span>{{ isSubmitting ? t("invite.signingIn") : t("invite.loginSubmit") }}</span>
						<span v-if="isSubmitting" class="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true"></span>
					</button>

					<button v-if="!isClaimed" type="button" class="text-center text-xs font-semibold text-flixer-accent underline-offset-2 hover:underline" @click="step = 'form'">
						{{ t("common.back") }}
					</button>
				</form>
			</template>

			<template v-else-if="step === 'payment'">
				<SignupPaymentStep :token="paymentToken" :name="username" :email="email" :back-label="t('common.back')" @paid="handlePaid" @expired="handlePaymentExpired" @back="handlePaymentBack" />
			</template>

			<template v-else-if="step === 'verification'">
				<span class="mt-6 block text-center text-[9px] font-bold tracking-[0.2em] text-flixer-accent">{{ t("auth.oneLastStep") }}</span>
				<h1 class="mt-2 text-center text-2xl font-semibold tracking-tight">{{ t("invite.verifyTitle") }}</h1>
				<p class="mt-3 text-center text-sm text-flixer-muted">{{ t("invite.verifyDescription", { email: verificationEmail, name: destinationName }) }}</p>
				<p class="mt-3 text-center text-xs text-flixer-muted">{{ t("auth.cantFindEmail") }}</p>

				<div v-if="verificationResendToken" class="mt-6 flex flex-col gap-2">
					<button type="button" class="flex h-11 items-center justify-center gap-2 rounded bg-gradient-to-r from-flixer-primary to-flixer-secondary text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60" :disabled="isResendingVerification" :aria-busy="isResendingVerification" @click="resendVerification">
						<span>{{ isResendingVerification ? t("invite.resendingVerification") : t("invite.resendVerification") }}</span>
						<span v-if="isResendingVerification" class="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true"></span>
					</button>
					<button type="button" class="flex h-10 items-center justify-center rounded border border-flixer-border text-xs font-semibold text-flixer-text transition hover:bg-flixer-border/40" @click="step = isClaimed && !isPlexInvite ? 'login' : 'form'">
						{{ t("invite.backToForm") }}
					</button>
				</div>
			</template>

			<template v-else-if="step === 'done'">
				<h1 class="mt-6 text-center text-2xl font-semibold tracking-tight">{{ t("invite.doneTitle") }}</h1>
				<p class="mt-3 text-center text-sm text-flixer-muted">
					{{ destination?.invitedByEmail ? t("invite.plexEmailSent", { email }) : t("invite.doneDescription", { name: destinationName }) }}
				</p>
				<p v-if="destination?.type === 'jellyfin' || destination?.type === 'emby'" class="mt-2 text-center text-xs text-flixer-muted">{{ t("invite.sameCredentials") }}</p>
				<p v-if="destination?.instructions" class="mt-4 whitespace-pre-wrap rounded border border-flixer-border bg-flixer-background/60 p-3 text-left text-xs leading-5 text-flixer-text">{{ destination.instructions }}</p>
				<div class="mt-6 flex flex-col gap-2">
					<a v-if="destinationUrl" :href="destinationUrl" target="_blank" rel="noopener noreferrer" class="flex h-11 items-center justify-center rounded bg-gradient-to-r from-flixer-primary to-flixer-secondary text-sm font-semibold text-white transition hover:brightness-110">
						{{ t("invite.open", { name: destinationName }) }}
					</a>
					<a v-if="plexCloudUrl" :href="plexCloudUrl" target="_blank" rel="noopener noreferrer" class="flex h-11 items-center justify-center rounded border border-flixer-border text-sm font-semibold text-flixer-text transition hover:bg-flixer-border/40">
						{{ t("invite.openPlexCloud") }}
					</a>
					<button type="button" class="flex h-11 items-center justify-center rounded text-sm font-semibold transition" :class="destinationUrl ? 'border border-flixer-border text-flixer-text hover:bg-flixer-border/40' : 'bg-gradient-to-r from-flixer-primary to-flixer-secondary text-white hover:brightness-110'" @click="enterFlixer">
						{{ t("invite.continueToFlixer") }}
					</button>
				</div>
			</template>
		</div>
	</main>
</template>
