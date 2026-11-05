import { useI18n } from "vue-i18n";
import { formatMoney, type PlanInterval, type Price } from "../api";

/** Formatting shared by the checkout, billing and admin payment screens, in the current language. */
export function usePaymentFormat() {
	const { t, locale } = useI18n();

	const money = (amountMinor: number, currency: string) => formatMoney(amountMinor, currency, locale.value);
	const price = (value: Price | null | undefined) => (value ? money(value.amountMinor, value.currency) : "");
	const interval = (value: PlanInterval) => t(`payments.interval.${value}`);
	const recurring = (value: Price | null | undefined, per: PlanInterval) => (value ? t("payments.perInterval", { price: money(value.amountMinor, value.currency), interval: interval(per) }) : "");
	const hours = (count: number) => (count >= 48 && count % 24 === 0 ? t("payments.duration.days", { count: count / 24 }) : t("payments.duration.hours", { count }));
	const date = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString(locale.value, { year: "numeric", month: "short", day: "numeric" }) : "");
	const dateTime = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleString(locale.value, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "");
	const countdown = (ms: number) => {
		const minutes = Math.max(0, Math.ceil(ms / 60_000));
		if (minutes >= 2880) return t("payments.duration.days", { count: Math.floor(minutes / 1440) });
		if (minutes >= 60) return t("payments.duration.hoursMinutes", { hours: Math.floor(minutes / 60), minutes: minutes % 60 });
		return t("payments.duration.minutes", { count: minutes });
	};

	return { money, price, interval, recurring, hours, date, dateTime, countdown };
}
