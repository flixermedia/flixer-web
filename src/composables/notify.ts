import { toast, type ToastContainerOptions, type ToastOptions } from "vue3-toastify";
import "vue3-toastify/dist/index.css";

export const toastContainerOptions: ToastContainerOptions = {
	theme: "dark",
	position: "bottom-right",
	autoClose: 5000,
	pauseOnFocusLoss: false,
	limit: 4,
};

const baseOptions: ToastOptions = { toastClassName: "flixer-toast" };

export const notify = {
	success: (message: string) => toast.success(message, baseOptions),
	error: (message: string, error?: Error | undefined) => toast.error(message, { ...baseOptions, autoClose: 8000 }) && (import.meta.env.DEV ? console.error(error) : false),
	info: (message: string) => toast.info(message, baseOptions),
};
