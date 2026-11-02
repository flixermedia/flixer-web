import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';
export const toastContainerOptions = {
    theme: 'dark',
    position: 'bottom-right',
    autoClose: 5000,
    pauseOnFocusLoss: false,
    limit: 4,
};
const baseOptions = { toastClassName: 'flixer-toast' };
export const notify = {
    success: (message) => toast.success(message, baseOptions),
    error: (message) => toast.error(message, { ...baseOptions, autoClose: 8000 }),
    info: (message) => toast.info(message, baseOptions),
};
