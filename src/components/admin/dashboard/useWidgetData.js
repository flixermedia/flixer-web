import { onBeforeUnmount, onMounted, ref } from 'vue';
import { catchError } from '../../../utils/catchError';
/** Loads a widget's data once and then every `intervalMs`; a failed refresh keeps the last data and sets `failed`. */
export function useWidgetData(load, intervalMs = 15000) {
    const data = ref(null);
    const failed = ref(false);
    let timer;
    async function refresh() {
        const [error, result] = await catchError(load());
        if (error) {
            console.error('[dashboard] widget failed to load', error);
            failed.value = true;
        }
        else {
            data.value = result;
            failed.value = false;
        }
    }
    onMounted(() => {
        void refresh();
        timer = setInterval(() => void refresh(), intervalMs);
    });
    onBeforeUnmount(() => clearInterval(timer));
    return { data, failed, refresh };
}
