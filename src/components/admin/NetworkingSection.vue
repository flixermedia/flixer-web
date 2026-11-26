<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { listSettings, updateSetting } from "../../api";
import { applyStep, describeFailure, getProgress, type ConfigField } from "../../setup/setupApi";
import { confirmAction } from "../../composables/confirm";
import { notify } from "../../composables/notify";
import { describeRequestError } from "../../composables/useProfile";
import { requestPassword } from "../../composables/requestPassword";
import AdminSection from "./AdminSection.vue";
import AdminSkeleton from "./AdminSkeleton.vue";
import AdminToggle from "./AdminToggle.vue";
import { catchError } from "../../utils/catchError";

interface TrustedProxies {
	enabled: boolean;
	addresses: string[];
}

const FIELDS = ["publicUrl", "appUrl", "passkeyRpId", "passkeyOrigins"] as const;
type Field = (typeof FIELDS)[number];

const { t } = useI18n();
const config = ref<Record<string, ConfigField>>({});
const form = reactive<Record<Field, string>>({ publicUrl: "", appUrl: "", passkeyRpId: "", passkeyOrigins: "" });
const errors = reactive<Record<string, string>>({});
const isLoading = ref(true);
const isSaving = ref(false);
const proxiesLoading = ref(true);
const proxiesBusy = ref(false);
const proxies = reactive({ enabled: false, addresses: "" });
const savedProxies = ref<TrustedProxies | null>(null);

function readProxies(value: unknown): TrustedProxies | null {
	if (!value || typeof value !== "object") return null;
	const candidate = value as TrustedProxies;
	return typeof candidate.enabled === "boolean" && Array.isArray(candidate.addresses) && candidate.addresses.every((address) => typeof address === "string")
		? { enabled: candidate.enabled, addresses: [...candidate.addresses] }
		: null;
}

const proxyAddresses = computed(() =>
	proxies.addresses
		.split(/[\n,]+/)
		.map((address) => address.trim())
		.filter(Boolean),
);
const proxiesChanged = computed(() => savedProxies.value && JSON.stringify({ enabled: proxies.enabled, addresses: proxyAddresses.value }) !== JSON.stringify(savedProxies.value));

const inputClass = "mt-1 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 font-mono text-sm text-flixer-text disabled:opacity-60";
const button = "rounded bg-flixer-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-flixer-primary/80 disabled:opacity-60";

const fields: { id: Field; label: string; hint: string; placeholder: string; wide?: boolean }[] = [
	{ id: "publicUrl", label: "admin.general.publicAddress", hint: "admin.general.publicAddressHint", placeholder: "https://flixer.example.com/api" },
	{ id: "appUrl", label: "admin.general.appAddress", hint: "admin.general.appAddressHint", placeholder: "https://flixer.example.com" },
	{ id: "passkeyRpId", label: "admin.general.passkeyDomain", hint: "admin.general.passkeyDomainHint", placeholder: "flixer.example.com" },
	{ id: "passkeyOrigins", label: "admin.general.passkeyOrigins", hint: "admin.general.passkeyOriginsHint", placeholder: "https://flixer.example.com", wide: true },
];

async function load() {
	try {
		const [error, progress] = await catchError(getProgress());
		if (error) {
			console.error("[networking] failed to load addresses", error);
			notify.error(describeFailure(error, t("admin.general.networkingLoadFailed")).message);
		} else {
			config.value = progress.config;
			for (const field of FIELDS) form[field] = config.value[field]?.value ?? "";
		}
	} finally {
		isLoading.value = false;
	}
}

async function save() {
	if (isSaving.value) return;
	isSaving.value = true;
	try {
		const [modalError, password] = await catchError(
			requestPassword({
				title: t("admin.general.networkingPassword"),
				description: t("admin.general.networkingPasswordHint"),
				passwordLabel: t("admin.general.networkingPassword"),
				submitLabel: t("common.continue"),
				danger: true,
			}),
		);
		if (modalError) {
			console.error("[networking] could not request password", modalError);
			notify.error(t("admin.general.networkingSaveFailed"));
			return;
		}
		if (!password) return;

		for (const key of Object.keys(errors)) delete errors[key];
		const [error] = await catchError(applyStep("urls", { ...form }, password));
		if (error) {
			const failure = describeFailure(error, t("admin.general.networkingSaveFailed"));
			Object.assign(errors, failure.fields);
			notify.error(failure.message);
		} else {
			notify.success(t("admin.general.networkingSaved"));
			await load();
		}
	} finally {
		isSaving.value = false;
	}
}

async function loadProxies() {
	try {
		const [error, settings] = await catchError(listSettings());
		if (error) {
			console.error("[networking] failed to load trusted proxies", error);
			return;
		}
		const proxySetting = readProxies(settings.find((setting) => setting.key === "trusted_proxies")?.value);
		savedProxies.value = proxySetting;
		if (proxySetting) Object.assign(proxies, { enabled: proxySetting.enabled, addresses: proxySetting.addresses.join("\n") });
	} finally {
		proxiesLoading.value = false;
	}
}

async function saveProxies() {
	if (proxiesBusy.value || !savedProxies.value || !proxiesChanged.value || proxyAddresses.value.length > 32 || (proxies.enabled && !proxyAddresses.value.length)) return;
	proxiesBusy.value = true;
	try {
		if (proxies.enabled && !(await confirmAction(t("admin.loginSecurity.confirmProxies"), { danger: true }))) return;
		const [error, result] = await catchError(updateSetting("trusted_proxies", { enabled: proxies.enabled, addresses: proxyAddresses.value }));
		if (error) {
			notify.error(describeRequestError(error, t("admin.loginSecurity.saveFailed")));
			return;
		}
		const saved = readProxies(result.value);
		if (!saved) {
			notify.error(t("admin.loginSecurity.saveFailed"));
			return;
		}
		savedProxies.value = saved;
		Object.assign(proxies, { enabled: saved.enabled, addresses: saved.addresses.join("\n") });
		notify.success(t("admin.loginSecurity.saved"));
	} finally {
		proxiesBusy.value = false;
	}
}

onMounted(() => {
	void load();
	void loadProxies();
});
</script>

<template>
	<div class="flex flex-col gap-6">
		<AdminSection :title="t('admin.general.networkingTitle')" :description="t('admin.general.networkingDescription')">
			<template #actions>
				<button type="button" :class="button" :disabled="isLoading || isSaving" @click="save">{{ t("common.save") }}</button>
			</template>
			<AdminSkeleton v-if="isLoading" variant="fields" :rows="4" />
			<div v-else class="grid gap-4 md:grid-cols-2">
				<label v-for="field in fields" :key="field.id" class="text-xs text-flixer-muted" :class="{ 'md:col-span-2': field.wide }">
					{{ t(field.label) }}
					<input v-model.trim="form[field.id]" type="text" autocomplete="off" spellcheck="false" :placeholder="field.placeholder" :disabled="config[field.id]?.locked || isSaving" :class="inputClass" />
					<span class="mt-1 block">{{ config[field.id]?.locked ? t("admin.connections.environment") : t(field.hint) }}</span>
					<span v-if="errors[field.id]" role="alert" class="mt-1 block text-red-300">{{ errors[field.id] }}</span>
				</label>
			</div>
		</AdminSection>

		<AdminSection :title="t('admin.loginSecurity.trustProxies')">
			<AdminSkeleton v-if="proxiesLoading" variant="toggles" :rows="2" />
			<p v-else-if="!savedProxies" role="alert" class="text-sm text-red-300">{{ t("admin.loginSecurity.loadFailed") }}</p>
			<form v-else class="space-y-3" @submit.prevent="saveProxies">
				<AdminToggle v-model="proxies.enabled" :label="t('admin.loginSecurity.trustProxies')" :disabled="proxiesBusy" />
				<p class="text-xs text-amber-300">{{ t("admin.loginSecurity.proxyWarning") }}</p>
				<label class="block text-sm text-flixer-muted">
					{{ t("admin.loginSecurity.proxyAddresses") }}
					<textarea v-model="proxies.addresses" rows="3" :disabled="proxiesBusy" :class="inputClass" placeholder="192.0.2.10&#10;2001:db8::/32" />
				</label>
				<p v-if="proxyAddresses.length > 32" role="alert" class="text-sm text-red-300">{{ t("admin.loginSecurity.proxyLimit") }}</p>
				<p v-if="proxies.enabled && !proxyAddresses.length" role="alert" class="text-sm text-red-300">{{ t("admin.loginSecurity.proxyRequired") }}</p>
				<button type="submit" :class="button" :disabled="proxiesBusy || proxyAddresses.length > 32 || (proxies.enabled && !proxyAddresses.length) || !proxiesChanged">{{ t("admin.loginSecurity.saveProxies") }}</button>
			</form>
		</AdminSection>
	</div>
</template>
