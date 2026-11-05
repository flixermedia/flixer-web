<script setup lang="ts">
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, useModalContext } from '@kolirt/vue-modal'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { cancelAdminSubscription, createGrant, getAdminUserPayments, refundOrder, removeUserCard, revokeGrant, waiveUserSignup, type AccountLevel, type AdminUser, type AdminUserPayments, type ContentScope, type MyOrder } from '../../api'
import { confirmAction } from '../../composables/confirm'
import { notify } from '../../composables/notify'
import { usePaymentFormat } from '../../composables/usePaymentFormat'
import { describeRequestError } from '../../composables/useProfile'
import { catchError } from '../../utils/catchError'
import { adminInput, dangerButton, primaryButton, secondaryButton } from './payments/adminPaymentStyles'
import ScopePicker from './payments/ScopePicker.vue'
import StatusPill from './StatusPill.vue'
import UserAvatar from '../ui/UserAvatar.vue'

defineOptions({ modalGroup: 'default' })

const props = defineProps<{ user: AdminUser }>()
const { close } = useModalContext<boolean>()
const { t } = useI18n()
const { money, dateTime } = usePaymentFormat()

const name = computed(() => props.user.displayName || props.user.username)
const data = ref<AdminUserPayments | null>(null)
const loading = ref(true)
const busy = ref('')
const scopes = ref<ContentScope[]>([])
const hours = ref<number | null>(null)

const levelChip = (level: AccountLevel) => (level === 'everything' || level === 'admin' || level === 'grandfathered' ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' : level === 'partial' ? 'border-flixer-primary/50 bg-flixer-primary/10 text-flixer-accent' : 'border-flixer-border text-flixer-muted')
const orderTone = (status: string) => (status === 'paid' ? 'good' : status === 'failed' ? 'bad' : status === 'pending' || status === 'requires_action' ? 'warn' : 'neutral')
const subscriptionTone = (status: string) => (status === 'active' || status === 'trialing' ? 'good' : status === 'past_due' ? 'warn' : 'neutral')
const refundable = (order: MyOrder) => (order.status === 'paid' || order.status === 'partially_refunded') && order.refundedMinor < order.totalMinor

function describe(scope: ContentScope) {
  return scope.type === 'all' ? t('payments.scope.all') : scope.type === 'kind' ? t('payments.scope.kindOf', { kind: t(`payments.kinds.${scope.ref}`) }) : scope.label || scope.ref || ''
}

async function load() {
  const [error, result] = await catchError(getAdminUserPayments(props.user.id))
  loading.value = false
  if (error) notify.error(describeRequestError(error, t('payments.admin.userPayments.loadError')))
  else data.value = result
}

async function run(key: string, action: () => Promise<unknown>, errorMessage: string, success?: string) {
  busy.value = key
  const [error] = await catchError(action())
  busy.value = ''
  if (error) {
    notify.error(describeRequestError(error, errorMessage))
    return
  }
  if (success) notify.success(success)
  await load()
}

async function waive() {
  if (!(await confirmAction(t('payments.admin.userPayments.waiveConfirm'), { confirmLabel: t('payments.admin.userPayments.waive') }))) return
  await run('waive', () => waiveUserSignup(props.user.id), t('payments.admin.saveError'), t('payments.admin.userPayments.waived'))
}

async function revoke(id: string) {
  if (!(await confirmAction(t('payments.admin.revokeConfirm'), { danger: true, confirmLabel: t('payments.admin.revoke') }))) return
  await run(id, () => revokeGrant(id), t('payments.admin.userPayments.revokeError'))
}

async function grant() {
  const scope = scopes.value[0]
  if (!scope) return
  await run(
    'grant',
    async () => {
      await createGrant(props.user.id, scope, hours.value || undefined)
      scopes.value = []
      hours.value = null
    },
    t('payments.admin.saveError'),
    t('payments.admin.granted'),
  )
}

async function cancelSubscription(id: string, planName: string, immediately: boolean) {
  const message = t(immediately ? 'payments.admin.cancelNowConfirm' : 'payments.admin.cancelEndConfirm', { user: name.value, plan: planName })
  if (!(await confirmAction(message, { danger: true, confirmLabel: immediately ? t('payments.admin.cancelNow') : t('payments.admin.cancelSubscription') }))) return
  await run(id, () => cancelAdminSubscription(id, immediately), t('payments.admin.cancelError'), t('payments.admin.canceled'))
}

async function removeCard(card: AdminUserPayments['methods'][number]) {
  if (!(await confirmAction(t('payments.admin.userPayments.removeCardConfirm', { brand: card.brand, last4: card.last4 }), { danger: true, confirmLabel: t('payments.admin.userPayments.removeCard') }))) return
  await run(card.id, () => removeUserCard(props.user.id, card.id), t('payments.admin.userPayments.removeCardError'), t('payments.admin.userPayments.cardRemoved'))
}

async function refund(order: MyOrder) {
  const remaining = money(order.totalMinor - order.refundedMinor, order.currency)
  if (!(await confirmAction(t('payments.admin.refundConfirm', { amount: remaining, user: name.value }), { danger: true, confirmLabel: t('payments.admin.refund') }))) return
  await run(order.id, () => refundOrder(order.id), t('payments.admin.refundError'), t('payments.admin.refunded'))
}

onMounted(load)

const section = 'border-t border-flixer-border pt-5 first:border-t-0 first:pt-0'
const heading = 'text-sm font-semibold'
</script>

<template>
  <ModalRoot class="flex items-center justify-center p-4">
    <ModalContent class="flixer-modal-card flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col rounded border border-flixer-border bg-flixer-surface text-flixer-text shadow-2xl shadow-black/60">
      <header class="flex shrink-0 items-center gap-4 border-b border-flixer-border px-6 py-5">
        <div class="size-11 shrink-0 overflow-hidden rounded"><UserAvatar :avatar-url="user.avatarUrl" :name="user.displayName" /></div>
        <div class="min-w-0 flex-1">
          <ModalTitle class="flex items-center gap-2 text-lg font-semibold"><Icon icon="lucide:credit-card" class="size-5 text-flixer-accent" aria-hidden="true" />{{ t('payments.admin.userPayments.manage', { name }) }}</ModalTitle>
          <ModalDescription class="mt-0.5 text-sm text-flixer-muted">{{ t('payments.admin.userPayments.description') }}</ModalDescription>
        </div>
        <span v-if="data" class="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold" :class="levelChip(data.level)">{{ t(`payments.admin.userPayments.levelShort.${data.level}`) }}</span>
      </header>

      <div v-if="loading" class="grid h-64 place-items-center text-sm text-flixer-muted" role="status">{{ t('payments.loading') }}</div>
      <div v-else class="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-6 py-5 [scrollbar-width:thin]">

        <template v-if="data">
          <section :class="section">
            <h3 :class="heading">{{ t('payments.admin.userPayments.status') }}</h3>
            <p class="mt-0.5 text-sm text-flixer-muted">{{ t(`payments.admin.userPayments.level.${data.level}`) }}</p>
            <div v-if="data.signupPending" class="mt-3 flex flex-wrap items-center justify-between gap-3 rounded border border-amber-500/30 bg-amber-500/10 p-3">
              <p class="min-w-0 flex-1 text-sm text-amber-200">{{ t('payments.admin.userPayments.signupPending') }}</p>
              <button type="button" :class="secondaryButton" :disabled="busy === 'waive'" @click="waive">{{ t('payments.admin.userPayments.waive') }}</button>
            </div>
          </section>

          <section :class="section">
            <h3 :class="heading">{{ t('payments.admin.userPayments.subscriptions') }}</h3>
            <p v-if="data.subscriptions.length === 0" class="mt-2 text-sm text-flixer-muted">{{ t('payments.admin.userPayments.noSubscriptions') }}</p>
            <ul v-else class="mt-2 divide-y divide-flixer-border">
              <li v-for="sub in data.subscriptions" :key="sub.id" class="flex flex-wrap items-center gap-3 py-2.5">
                <div class="min-w-0 flex-1">
                  <p class="flex items-center gap-2 truncate text-sm font-medium">
                    {{ sub.planName }}
                    <StatusPill :tone="subscriptionTone(sub.status)">{{ t(`payments.status.${sub.status}`) }}</StatusPill>
                  </p>
                  <p class="text-xs text-flixer-muted">{{ money(sub.amountMinor, sub.currency) }} · {{ sub.cancelAtPeriodEnd || sub.status === 'canceled' ? t('payments.admin.userPayments.endsOn', { date: dateTime(sub.periodEnd) }) : t('payments.admin.userPayments.renews', { date: dateTime(sub.periodEnd) }) }}</p>
                </div>
                <div v-if="sub.status !== 'canceled' && sub.status !== 'expired'" class="flex gap-2">
                  <button v-if="!sub.cancelAtPeriodEnd" type="button" :class="secondaryButton" :disabled="busy === sub.id" @click="cancelSubscription(sub.id, sub.planName, false)">{{ t('payments.admin.cancelSubscription') }}</button>
                  <button type="button" :class="dangerButton" :disabled="busy === sub.id" @click="cancelSubscription(sub.id, sub.planName, true)">{{ t('payments.admin.cancelNow') }}</button>
                </div>
              </li>
            </ul>
          </section>

          <section :class="section">
            <h3 :class="heading">{{ t('payments.admin.userPayments.unlocked') }}</h3>
            <p v-if="data.entitlements.length === 0" class="mt-2 text-sm text-flixer-muted">{{ t('payments.admin.userPayments.noUnlocked') }}</p>
            <ul v-else class="mt-2 divide-y divide-flixer-border">
              <li v-for="entry in data.entitlements" :key="entry.id" class="flex flex-wrap items-center gap-3 py-2.5">
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium">{{ describe(entry.scope) }}</p>
                  <p class="text-xs text-flixer-muted">
                    {{ t(`payments.admin.userPayments.source.${entry.source}`) }} ·
                    {{ entry.rentalNotStarted ? t('payments.admin.userPayments.notStarted') : entry.expiresAt ? t('payments.admin.expiresOn', { date: dateTime(entry.expiresAt) }) : t('payments.admin.neverExpires') }}
                  </p>
                </div>
                <button type="button" :class="dangerButton" :disabled="busy === entry.id" @click="revoke(entry.id)">{{ t('payments.admin.revoke') }}</button>
              </li>
            </ul>
            <form class="mt-4 space-y-3 border-t border-flixer-border pt-4" @submit.prevent="grant">
              <div>
                <h4 class="text-sm font-medium">{{ t('payments.admin.userPayments.giveAccess') }}</h4>
                <p class="text-xs text-flixer-muted">{{ t('payments.admin.userPayments.giveAccessHint') }}</p>
              </div>
              <ScopePicker v-model="scopes" :label="t('payments.admin.grantScope')" />
              <label class="block text-sm font-medium sm:w-1/2">
                {{ t('payments.admin.grantHours') }}
                <input v-model.number="hours" type="number" min="1" max="87600" :placeholder="t('payments.admin.neverExpires')" :class="[adminInput, 'mt-2 w-full']" />
              </label>
              <div class="flex justify-end">
                <button type="submit" :class="primaryButton" :disabled="busy === 'grant' || scopes.length === 0">{{ t('payments.admin.grant') }}</button>
              </div>
            </form>
          </section>

          <section :class="section">
            <h3 :class="heading">{{ t('payments.admin.userPayments.cards') }}</h3>
            <p v-if="data.methods.length === 0" class="mt-2 text-sm text-flixer-muted">{{ t('payments.admin.userPayments.noCards') }}</p>
            <ul v-else class="mt-2 divide-y divide-flixer-border">
              <li v-for="method in data.methods" :key="method.id" class="flex flex-wrap items-center gap-3 py-2.5">
                <div class="min-w-0 flex-1">
                  <p class="flex items-center gap-2 text-sm font-medium">
                    <span class="capitalize">{{ method.brand }}</span> •••• {{ method.last4 }}
                    <StatusPill v-if="method.isDefault" tone="accent">{{ t('payments.admin.userPayments.defaultCard') }}</StatusPill>
                  </p>
                  <p class="text-xs text-flixer-muted">{{ String(method.expMonth).padStart(2, '0') }}/{{ String(method.expYear).slice(-2) }}</p>
                </div>
                <button type="button" :class="dangerButton" :disabled="busy === method.id" @click="removeCard(method)">{{ t('payments.admin.userPayments.removeCard') }}</button>
              </li>
            </ul>
          </section>

          <section :class="section">
            <h3 :class="heading">{{ t('payments.admin.userPayments.orders') }}</h3>
            <p v-if="data.orders.length === 0" class="mt-2 text-sm text-flixer-muted">{{ t('payments.admin.userPayments.noOrders') }}</p>
            <ul v-else class="mt-2 divide-y divide-flixer-border">
              <li v-for="order in data.orders" :key="order.id" class="flex flex-wrap items-center gap-3 py-2.5">
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium">{{ order.description }}</p>
                  <p class="text-xs text-flixer-muted">{{ dateTime(order.createdAt) }} · {{ money(order.totalMinor, order.currency) }}<template v-if="order.refundedMinor > 0"> · {{ t('payments.billing.refunded', { amount: money(order.refundedMinor, order.currency) }) }}</template></p>
                </div>
                <StatusPill :tone="orderTone(order.status)">{{ t(`payments.orderStatus.${order.status}`) }}</StatusPill>
                <button v-if="refundable(order)" type="button" :class="dangerButton" :disabled="busy === order.id" @click="refund(order)">{{ t('payments.admin.refund') }}</button>
              </li>
            </ul>
          </section>
        </template>
      </div>

      <footer class="flex shrink-0 justify-end border-t border-flixer-border px-6 py-4">
        <button type="button" class="flex h-11 items-center justify-center rounded bg-flixer-primary px-6 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flixer-accent disabled:opacity-60" @click="close()">{{ t('common.close') }}</button>
      </footer>
    </ModalContent>
  </ModalRoot>
</template>
