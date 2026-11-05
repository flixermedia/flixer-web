import { listPaymentCurrencies, registerCurrencyDigits, type CurrencyInfo, type PaymentProviderId } from "../api";

const cache = new Map<string, Promise<CurrencyInfo[]>>();

/** Currency metadata (name, digits, Square support) from the server, cached per provider; digits are also registered for money formatting. */
export function loadPaymentCurrencies(provider?: PaymentProviderId | null): Promise<CurrencyInfo[]> {
	const key = provider ?? "all";
	let pending = cache.get(key);
	if (!pending) {
		pending = listPaymentCurrencies(provider).then((list) => {
			registerCurrencyDigits(list);
			return list;
		});
		pending.catch(() => cache.delete(key));
		cache.set(key, pending);
	}
	return pending;
}

export function clearPaymentCurrencyCache() {
	cache.clear();
}
