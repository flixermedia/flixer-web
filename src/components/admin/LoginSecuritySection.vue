<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { updateSetting, type ServerSetting } from '../../api'
import { confirmAction } from '../../composables/confirm'
import { notify } from '../../composables/notify'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import AdminSection from './AdminSection.vue'
import AdminSkeleton from './AdminSkeleton.vue'
import AdminToggle from './AdminToggle.vue'

interface LoginSecurity {
  timingEnabled: boolean
  minimumMs: number
  jitterMs: number
  throttleEnabled: boolean
  ipLimit: number
  usernameLimit: number
  windowSeconds: number
}
const props = defineProps<{ settings: ServerSetting[]; loading: boolean }>()
const { t } = useI18n()
const login = reactive<LoginSecurity>({ timingEnabled: true, minimumMs: 400, jitterMs: 40, throttleEnabled: true, ipLimit: 20, usernameLimit: 10, windowSeconds: 60 })
const savedLogin = ref<LoginSecurity | null>(null)
const busy = ref(false)
const inputClass = 'mt-1 w-full rounded border border-flixer-border bg-flixer-background px-3 py-2 text-sm disabled:opacity-60'
const buttonClass = 'rounded bg-flixer-primary px-4 py-2 text-sm font-semibold text-white hover:bg-flixer-primary/80 disabled:opacity-60'

function readLogin(value: unknown): LoginSecurity | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as LoginSecurity
  return typeof candidate.timingEnabled === 'boolean' && typeof candidate.throttleEnabled === 'boolean' &&
    ['minimumMs', 'jitterMs', 'ipLimit', 'usernameLimit', 'windowSeconds'].every((key) => typeof candidate[key as keyof LoginSecurity] === 'number')
    ? { ...candidate } : null
}

watch(() => props.settings, (settings) => {
  const loginSetting = readLogin(settings.find((setting) => setting.key === 'login_security')?.value)
  savedLogin.value = loginSetting
  if (loginSetting) Object.assign(login, loginSetting)
}, { immediate: true })

const loginValid = computed(() => [
  [login.minimumMs, 100, 5000], [login.jitterMs, 0, 1000], [login.ipLimit, 1, 1000],
  [login.usernameLimit, 1, 1000], [login.windowSeconds, 10, 3600],
].every(([value, minimum, maximum]) => Number.isInteger(value) && value >= minimum && value <= maximum))
const loginChanged = computed(() => savedLogin.value && (Object.keys(login) as Array<keyof LoginSecurity>).some((key) => login[key] !== savedLogin.value?.[key]))

async function saveLogin() {
  if (busy.value || !savedLogin.value || !loginValid.value || !loginChanged.value) return
  busy.value = true
  try {
    const previous = savedLogin.value
    const weaker = (previous.timingEnabled && (!login.timingEnabled || login.minimumMs < previous.minimumMs || login.jitterMs < previous.jitterMs)) ||
      (previous.throttleEnabled && (!login.throttleEnabled || login.ipLimit > previous.ipLimit || login.usernameLimit > previous.usernameLimit || login.windowSeconds < previous.windowSeconds))
    if (weaker && !(await confirmAction(t('admin.loginSecurity.confirmWeaker'), { danger: true }))) return
    const [error, result] = await catchError(updateSetting('login_security', { ...login }))
    if (error) {
      notify.error(describeRequestError(error, t('admin.loginSecurity.saveFailed')))
      return
    }
    const saved = readLogin(result.value)
    if (!saved) { notify.error(t('admin.loginSecurity.saveFailed')); return }
    savedLogin.value = saved
    Object.assign(login, saved)
    notify.success(t('admin.loginSecurity.saved'))
  } finally { busy.value = false }
}
</script>

<template>
  <AdminSection :title="t('admin.loginSecurity.title')">
    <AdminSkeleton v-if="loading" variant="toggles" :rows="2" />
    <p v-else-if="!savedLogin" role="alert" class="text-sm text-red-300">{{ t('admin.loginSecurity.loadFailed') }}</p>
    <template v-else>
      <form class="space-y-4" @submit.prevent="saveLogin">
        <AdminToggle v-model="login.timingEnabled" :label="t('admin.loginSecurity.timing')" :disabled="busy" />
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="text-sm text-flixer-muted">{{ t('admin.loginSecurity.minimumMs') }}<input v-model.number="login.minimumMs" type="number" min="100" max="5000" step="1" :disabled="busy || !login.timingEnabled" :class="inputClass" /></label>
          <label class="text-sm text-flixer-muted">{{ t('admin.loginSecurity.jitterMs') }}<input v-model.number="login.jitterMs" type="number" min="0" max="1000" step="1" :disabled="busy || !login.timingEnabled" :class="inputClass" /></label>
        </div>
        <AdminToggle v-model="login.throttleEnabled" :label="t('admin.loginSecurity.throttle')" :disabled="busy" />
        <p v-if="!login.timingEnabled || !login.throttleEnabled" class="text-xs text-amber-300">{{ t('admin.loginSecurity.disabledWarning') }}</p>
        <div class="grid gap-3 sm:grid-cols-3">
          <label class="text-sm text-flixer-muted">{{ t('admin.loginSecurity.ipLimit') }}<input v-model.number="login.ipLimit" type="number" min="1" max="1000" step="1" :disabled="busy || !login.throttleEnabled" :class="inputClass" /></label>
          <label class="text-sm text-flixer-muted">{{ t('admin.loginSecurity.usernameLimit') }}<input v-model.number="login.usernameLimit" type="number" min="1" max="1000" step="1" :disabled="busy || !login.throttleEnabled" :class="inputClass" /></label>
          <label class="text-sm text-flixer-muted">{{ t('admin.loginSecurity.windowSeconds') }}<input v-model.number="login.windowSeconds" type="number" min="10" max="3600" step="1" :disabled="busy || !login.throttleEnabled" :class="inputClass" /></label>
        </div>
        <p class="text-xs text-flixer-muted">{{ t('admin.loginSecurity.limitScope') }}</p>
        <p v-if="!loginValid" role="alert" class="text-sm text-red-300">{{ t('admin.loginSecurity.invalid') }}</p>
        <button type="submit" :class="buttonClass" :disabled="busy || !loginValid || !loginChanged">{{ t('admin.loginSecurity.saveLogin') }}</button>
      </form>
    </template>
  </AdminSection>
</template>