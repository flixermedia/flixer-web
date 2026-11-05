import { openModal } from "@kolirt/vue-modal";
import { computed, ref } from "vue";
import { checkLocks, getPaymentStatus, isPaymentRequired, type ActivePaymentStatus, type LockState, type PaymentStatus } from "../api";

const status = ref<PaymentStatus | null>(null);
let loading: Promise<PaymentStatus> | null = null;

/** Payments are off unless the server says otherwise; a server without payments or a failed request reads as off. */
function loadStatus(force = false): Promise<PaymentStatus> {
	if (force) loading = null;
	loading ??= getPaymentStatus()
		.catch((): PaymentStatus => ({ enabled: false }))
		.then((result) => (status.value = result));
	return loading;
}

const locks = ref<Record<string, LockState>>({});
const known = new Set<string>();
const queued = new Set<string>();
let timer: ReturnType<typeof setTimeout> | undefined;
const BATCH = 200;

async function flushLocks() {
	timer = undefined;
	const ids = [...queued];
	queued.clear();
	if (ids.length === 0 || !(await loadStatus()).enabled) return;
	for (let start = 0; start < ids.length; start += BATCH) {
		const result = await checkLocks(ids.slice(start, start + BATCH)).catch(() => null);
		if (result?.enabled) locks.value = { ...locks.value, ...result.items };
	}
}

/** Asks which items are locked; requests from many cards on one page are sent together. */
export function requestLock(id: string) {
	if (known.has(id)) return;
	known.add(id);
	queued.add(id);
	timer ??= setTimeout(() => void flushLocks(), 40);
}

/** Looks every known item up again, for example after a purchase or when a rental has run out. */
export function refreshLocks() {
	for (const id of known) queued.add(id);
	timer ??= setTimeout(() => void flushLocks(), 0);
}

export function lockOf(id: string | undefined): LockState | undefined {
	return id ? locks.value[id] : undefined;
}

/** Opens the offers for a locked item. Resolves true when the viewer bought, rented or subscribed. */
export async function openOffers(itemId: string, title: string): Promise<boolean> {
	if (!(await loadStatus()).enabled) return false;
	const { default: OffersModal } = await import("../components/payments/OffersModal.vue");
	const unlocked = (await openModal<boolean>(OffersModal, { props: { itemId, title } }).catch(() => false)) === true;
	if (unlocked) refreshLocks();
	return unlocked;
}

/** If an error is a 402 paywall, opens the offers for the item and resolves with whether the viewer unlocked it. Null for any other error. */
export async function handlePaymentRequired(error: unknown, itemId: string, title: string): Promise<boolean | null> {
	if (!isPaymentRequired(error)) return null;
	locks.value = { ...locks.value, [itemId]: { locked: true } };
	return openOffers(itemId, title);
}

export function usePayments() {
	return {
		status,
		active: computed(() => status.value?.enabled === true),
		activeStatus: computed<ActivePaymentStatus | null>(() => (status.value?.enabled ? status.value : null)),
		load: loadStatus,
		openOffers,
		handlePaymentRequired,
	};
}
