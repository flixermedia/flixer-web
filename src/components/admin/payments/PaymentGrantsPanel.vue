<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { createGrant, listAdminUsers, listGrants, revokeGrant, type AdminUser, type ContentScope, type Grant } from "../../../api";
import { confirmAction } from "../../../composables/confirm";
import { notify } from "../../../composables/notify";
import { usePaymentFormat } from "../../../composables/usePaymentFormat";
import { describeRequestError } from "../../../composables/useProfile";
import { catchError } from "../../../utils/catchError";
import AdminSection from "../AdminSection.vue";
import { adminInput, adminSelect, dangerButton, primaryButton } from "./adminPaymentStyles";
import ScopePicker from "./ScopePicker.vue";

const { t } = useI18n();
const { dateTime } = usePaymentFormat();

const users = ref<AdminUser[]>([]);
const userId = ref("");
const grants = ref<Grant[]>([]);
const scopes = ref<ContentScope[]>([]);
const hours = ref<number | null>(null);
const saving = ref(false);

const scopeOf = computed(() => scopes.value[0] ?? null);

async function loadGrants() {
	if (!userId.value) {
		grants.value = [];
		return;
	}
	const [error, list] = await catchError(listGrants(userId.value));
	if (error) notify.error(describeRequestError(error, t("payments.admin.loadError")));
	else grants.value = list;
}

async function grant() {
	if (!userId.value || !scopeOf.value) return;
	saving.value = true;
	const [error] = await catchError(createGrant(userId.value, scopeOf.value, hours.value || undefined));
	saving.value = false;
	if (error) {
		notify.error(describeRequestError(error, t("payments.admin.saveError")));
		return;
	}
	notify.success(t("payments.admin.granted"));
	scopes.value = [];
	hours.value = null;
	await loadGrants();
}

async function revoke(entry: Grant) {
	if (!(await confirmAction(t("payments.admin.revokeConfirm"), { danger: true, confirmLabel: t("payments.admin.revoke") }))) return;
	const [error] = await catchError(revokeGrant(entry.id));
	if (error) notify.error(describeRequestError(error, t("payments.admin.deleteError")));
	else await loadGrants();
}

function describe(scope: ContentScope) {
	return scope.type === "all" ? t("payments.scope.all") : scope.type === "kind" ? t("payments.scope.kindOf", { kind: t(`payments.kinds.${scope.ref}`) }) : scope.label || scope.ref || "";
}

watch(userId, loadGrants);
onMounted(async () => {
	const [error, list] = await catchError(listAdminUsers());
	if (!error) users.value = list;
});
</script>

<template>
	<AdminSection :title="t('payments.admin.grants')" :description="t('payments.admin.grantsHint')">
		<div class="space-y-4">
			<label class="block text-sm font-medium">
				{{ t("payments.admin.user") }}
				<select v-model="userId" :class="[adminSelect, 'mt-2 w-full sm:w-80']">
					<option value="">{{ t("payments.admin.chooseUser") }}</option>
					<option v-for="user in users" :key="user.id" :value="user.id">{{ user.displayName || user.username }} (@{{ user.username }})</option>
				</select>
			</label>

			<template v-if="userId">
				<ul v-if="grants.length > 0" class="divide-y divide-flixer-border rounded border border-flixer-border bg-flixer-background/40 px-3">
					<li v-for="entry in grants" :key="entry.id" class="flex flex-wrap items-center gap-3 py-2.5">
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium">{{ describe(entry.scope) }}</p>
							<p class="text-xs text-flixer-muted">{{ entry.expiresAt ? t("payments.admin.expiresOn", { date: dateTime(entry.expiresAt) }) : t("payments.admin.neverExpires") }}</p>
						</div>
						<button type="button" :class="dangerButton" @click="revoke(entry)">{{ t("payments.admin.revoke") }}</button>
					</li>
				</ul>
				<p v-else class="text-sm text-flixer-muted">{{ t("payments.admin.noGrants") }}</p>

				<form class="space-y-4 rounded border border-flixer-border bg-flixer-background/40 p-4" @submit.prevent="grant">
					<ScopePicker v-model="scopes" :label="t('payments.admin.grantScope')" />
					<label class="block text-sm font-medium sm:w-1/2">
						{{ t("payments.admin.grantHours") }}
						<input v-model.number="hours" type="number" min="1" max="87600" :placeholder="t('payments.admin.neverExpires')" :class="[adminInput, 'mt-2 w-full']" />
					</label>
					<div class="flex justify-end">
						<button type="submit" :class="primaryButton" :disabled="saving || !scopeOf">{{ t("payments.admin.grant") }}</button>
					</div>
				</form>
			</template>
		</div>
	</AdminSection>
</template>
