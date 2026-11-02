import axios from 'axios';
import { ref } from 'vue';
import { getProfile } from '../api';
import { i18n } from '../i18n';
const profile = ref(null);
let pending = null;
// Shared across components so the header and the settings page stay in sync.
export function useProfile() {
    function load(force = false) {
        if (!force && profile.value) {
            return Promise.resolve();
        }
        pending ??= getProfile()
            .then((result) => {
            profile.value = result;
        })
            .catch((error) => {
            console.error('[profile] failed to load', error);
        })
            .finally(() => {
            pending = null;
        });
        return pending;
    }
    function setProfile(next) {
        profile.value = next;
    }
    function clear() {
        profile.value = null;
    }
    return { profile, load, setProfile, clear };
}
export function describeRequestError(error, fallback = i18n.global.t('errors.generic')) {
    if (axios.isAxiosError(error)) {
        if (!error.response) {
            return i18n.global.t('errors.network');
        }
        return error.response.data?.message || fallback;
    }
    return error instanceof Error && error.message ? error.message : fallback;
}
