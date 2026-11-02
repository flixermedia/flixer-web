import { openModal } from '@kolirt/vue-modal';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, useRouter } from 'vue-router';
import { getChatConversation, getChatConversations, getChatMessages, deleteChatConversation, markChatRead, removeChatMember, renameChatGroup, sendChatMessage } from '../api';
import NewChatModal from '../components/chat/NewChatModal.vue';
import Header from '../components/header/Header.vue';
import Skeleton from '../components/ui/Skeleton.vue';
import UserAvatar from '../components/ui/UserAvatar.vue';
import { getNavLinks } from '../composables/homeNav';
import { confirmAction } from '../composables/confirm';
import { conversationTitle, onChatEvent, useChatUnread, viewingChat } from '../composables/useChat';
import { describeRequestError, useProfile } from '../composables/useProfile';
import { useSignOut } from '../composables/useSignOut';
import { catchError } from '../utils/catchError';
const { defineProps, } = {};
const props = defineProps();
const { t } = useI18n();
const router = useRouter();
const { isSigningOut, signOut } = useSignOut();
const navLinks = computed(getNavLinks);
const { profile, load: loadProfile } = useProfile();
const unread = useChatUnread();
const conversations = ref([]);
const listLoading = ref(true);
const listFailed = ref(false);
const active = ref(null);
const messages = ref([]);
const hasMore = ref(false);
const threadLoading = ref(false);
const threadMissing = ref(false);
const draft = ref('');
const sending = ref(false);
const sendError = ref('');
const infoOpen = ref(false);
const renameDraft = ref('');
const scroller = ref(null);
const composer = ref(null);
// On phones the chat is locked below the header (the tab bar is hidden on this page) and the page itself never scrolls.
// While typing it follows the visual viewport so the iOS keyboard can't shift the page.
const typing = ref(false);
const frame = ref({ top: 0, height: 0 });
const headerShift = ref(0);
let headerHeight = 64;
const phone = window.matchMedia('(max-width: 767px)');
const isPhone = ref(phone.matches);
const locked = computed(() => isPhone.value);
function onPhoneChange() {
    isPhone.value = phone.matches;
    syncViewport();
}
function syncViewport() {
    // The chat scrolls inside its own panes, so the page itself never scrolls at any size.
    document.documentElement.style.overflow = 'hidden';
    if (!isPhone.value)
        return;
    const vv = window.visualViewport;
    const headerEl = document.querySelector('header.fixed');
    if (headerEl && !typing.value)
        headerHeight = headerEl.getBoundingClientRect().height;
    const viewTop = vv?.offsetTop ?? 0;
    const viewBottom = viewTop + (vv?.height ?? window.innerHeight);
    // iOS scrolls the visual viewport when the keyboard opens, so the navbar rides along with it.
    headerShift.value = typing.value ? viewTop : 0;
    const top = viewTop + headerHeight;
    const bottom = typing.value ? viewBottom : window.innerHeight;
    frame.value = { top, height: Math.max(0, bottom - top) };
    if (typing.value)
        window.scrollTo(0, 0);
}
function onComposerFocus() {
    typing.value = isPhone.value;
    syncViewport();
    setTimeout(syncViewport, 300);
    scrollToEnd();
}
function onComposerBlur() {
    typing.value = false;
    syncViewport();
    setTimeout(syncViewport, 300);
}
let stopEvents;
let threadToken = 0;
const self = computed(() => profile.value?.username);
const title = (conversation) => conversationTitle(conversation, self.value);
const isOwner = computed(() => active.value?.members.find((member) => member.username === self.value)?.role === 'owner');
const otherMember = (conversation) => conversation.members.find((member) => member.username !== self.value) ?? conversation.members[0];
function preview(conversation) {
    const last = conversation.lastMessage;
    if (!last)
        return t('chat.noMessages');
    if (last.kind === 'system')
        return last.body;
    const mine = last.sender?.username === self.value;
    const prefix = mine ? `${t('chat.you')}: ` : conversation.kind === 'group' && last.sender ? `${last.sender.displayName}: ` : '';
    return prefix + last.body;
}
function shortTime(iso) {
    const date = new Date(iso);
    const now = new Date();
    if (date.toDateString() === now.toDateString())
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const days = (now.getTime() - date.getTime()) / 86_400_000;
    return days < 7 ? date.toLocaleDateString([], { weekday: 'short' }) : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
const fullTime = (iso) => new Date(iso).toLocaleString();
function applyList(next) {
    conversations.value = next.conversations.map((conversation) => (conversation.id === props.id ? { ...conversation, unread: 0 } : conversation));
    unread.set(conversations.value.reduce((total, conversation) => total + conversation.unread, 0));
}
async function refreshList(silent = true) {
    if (!silent)
        listLoading.value = true;
    try {
        const [error, result] = await catchError(getChatConversations());
        if (error) {
            if (!silent)
                listFailed.value = true;
            return;
        }
        applyList(result);
        listFailed.value = false;
    }
    finally {
        listLoading.value = false;
    }
}
function nearBottom() {
    const el = scroller.value;
    return !el || el.scrollHeight - el.scrollTop - el.clientHeight < 120;
}
function scrollToEnd() {
    void nextTick(() => {
        if (scroller.value)
            scroller.value.scrollTop = scroller.value.scrollHeight;
    });
}
function merge(incoming) {
    const seen = new Set(messages.value.map((message) => message.id));
    const fresh = incoming.filter((message) => !seen.has(message.id));
    if (!fresh.length)
        return false;
    messages.value = [...messages.value, ...fresh].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return true;
}
async function openThread(id) {
    const token = ++threadToken;
    active.value = null;
    messages.value = [];
    hasMore.value = false;
    threadMissing.value = false;
    infoOpen.value = false;
    sendError.value = '';
    if (!id)
        return;
    threadLoading.value = true;
    try {
        const [error, result] = await catchError(Promise.all([getChatConversation(id), getChatMessages(id)]));
        if (error) {
            if (token === threadToken)
                threadMissing.value = true;
            return;
        }
        if (token !== threadToken)
            return;
        const [conversation, page] = result;
        active.value = conversation;
        renameDraft.value = conversation.name ?? '';
        messages.value = page.messages;
        hasMore.value = page.hasMore;
        conversations.value = conversations.value.map((entry) => (entry.id === id ? { ...entry, unread: 0 } : entry));
        unread.set(conversations.value.reduce((total, entry) => total + entry.unread, 0));
        scrollToEnd();
    }
    finally {
        if (token === threadToken)
            threadLoading.value = false;
    }
}
async function pollThread(id, token) {
    if (token !== threadToken)
        return;
    const last = messages.value[messages.value.length - 1];
    const stick = nearBottom();
    const [pageError, page] = await catchError(getChatMessages(id, last ? { after: last.createdAt } : {}));
    if (pageError)
        return; // The next tick retries.
    if (token !== threadToken)
        return;
    if (merge(page.messages)) {
        if (page.messages.some((message) => message.kind === 'system')) {
            const [conversationError, conversation] = await catchError(getChatConversation(id));
            if (conversationError)
                return; // The next tick retries.
            active.value = conversation;
        }
        if (stick)
            scrollToEnd();
    }
}
function onEvent(event) {
    const id = props.id;
    if (event.type === 'resync') {
        void refreshList();
        if (id)
            void pollThread(id, threadToken);
        return;
    }
    if (event.type === 'message' && id && event.conversationId === id) {
        const stick = nearBottom();
        if (merge([event.message]) && stick)
            scrollToEnd();
        if (!document.hidden && event.message.kind === 'text')
            void markChatRead(id).catch(() => undefined);
        void refreshList();
        return;
    }
    void refreshList();
    if (event.type === 'changed' && id && event.conversationId === id)
        void syncThread(id);
}
async function syncThread(id) {
    const token = threadToken;
    const [error, conversation] = await catchError(getChatConversation(id));
    if (error) {
        if (token === threadToken)
            threadMissing.value = true;
        return;
    }
    if (token !== threadToken)
        return;
    active.value = conversation;
    renameDraft.value = conversation.name ?? '';
    await pollThread(id, token);
}
async function loadEarlier() {
    const first = messages.value[0];
    if (!first || !props.id)
        return;
    const el = scroller.value;
    const previous = el?.scrollHeight ?? 0;
    const page = await getChatMessages(props.id, { before: first.createdAt });
    merge(page.messages);
    hasMore.value = page.hasMore;
    await nextTick();
    if (el)
        el.scrollTop = el.scrollHeight - previous;
}
async function send() {
    const body = draft.value.trim();
    if (!body || !props.id || sending.value)
        return;
    sending.value = true;
    sendError.value = '';
    try {
        const [error, message] = await catchError(sendChatMessage(props.id, body));
        if (error) {
            sendError.value = describeRequestError(error, t('chat.sendError'));
            return;
        }
        draft.value = '';
        merge([message]);
        scrollToEnd();
        void refreshList();
    }
    finally {
        sending.value = false;
        void nextTick(() => composer.value?.focus());
    }
}
function onComposerKey(event) {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        void send();
    }
}
async function newChat() {
    const [error, result] = await catchError(openModal(NewChatModal));
    if (error)
        return; // Dismissed.
    const conversation = result;
    if (conversation) {
        await refreshList();
        void router.push({ name: 'chat', params: { id: conversation.id } });
    }
}
async function addPeople() {
    if (!active.value)
        return;
    const [error, result] = await catchError(openModal(NewChatModal, { props: { addTo: { id: active.value.id, usernames: active.value.members.map((member) => member.username) } } }));
    if (error)
        return; // Dismissed.
    const conversation = result;
    if (conversation) {
        active.value = conversation;
        void pollThread(conversation.id, threadToken);
        void refreshList();
    }
}
async function rename() {
    const name = renameDraft.value.trim();
    if (!active.value || !name || name === active.value.name)
        return;
    const [error, conversation] = await catchError(renameChatGroup(active.value.id, name));
    if (error) {
        sendError.value = describeRequestError(error, t('chat.createError'));
        return;
    }
    active.value = conversation;
    void pollThread(active.value.id, threadToken);
    void refreshList();
}
async function leaveOrRemove(username) {
    if (!active.value)
        return;
    const leaving = username === self.value;
    const ok = await confirmAction(leaving ? t('chat.leaveConfirm') : t('chat.removeConfirm'), { title: leaving ? t('chat.leaveGroup') : t('chat.removePerson'), confirmLabel: leaving ? t('chat.leave') : t('chat.remove'), danger: true });
    if (!ok)
        return;
    const [removeError] = await catchError(removeChatMember(active.value.id, username));
    if (removeError) {
        sendError.value = describeRequestError(removeError, t('chat.createError'));
        return;
    }
    if (leaving) {
        await refreshList();
        void router.push({ name: 'chat' });
    }
    else {
        const [conversationError, conversation] = await catchError(getChatConversation(active.value.id));
        if (conversationError) {
            sendError.value = describeRequestError(conversationError, t('chat.createError'));
            return;
        }
        active.value = conversation;
        void pollThread(conversation.id, threadToken);
    }
}
async function deleteActive() {
    const conversation = active.value;
    if (!conversation)
        return;
    const group = conversation.kind === 'group';
    const ok = await confirmAction(group ? t('chat.deleteGroupConfirm') : t('chat.deleteChatConfirm'), { title: group ? t('chat.deleteGroup') : t('chat.deleteChat'), confirmLabel: t('chat.delete'), danger: true });
    if (!ok)
        return;
    const [error] = await catchError(deleteChatConversation(conversation.id));
    if (error) {
        sendError.value = describeRequestError(error, t('chat.createError'));
        return;
    }
    await refreshList();
    void router.push({ name: 'chat' });
}
function onVisible() {
    if (document.hidden)
        return;
    void refreshList();
    if (props.id)
        void markChatRead(props.id).catch(() => undefined);
}
watch(() => props.id, (id) => {
    viewingChat.value = id ?? null;
    void openThread(id);
}, { immediate: true });
onMounted(() => {
    void loadProfile();
    void refreshList(false);
    stopEvents = onChatEvent(onEvent);
    phone.addEventListener('change', onPhoneChange);
    window.addEventListener('resize', syncViewport);
    syncViewport();
    setTimeout(syncViewport, 300);
    window.visualViewport?.addEventListener('resize', syncViewport);
    window.visualViewport?.addEventListener('scroll', syncViewport);
    document.addEventListener('visibilitychange', onVisible);
});
onBeforeUnmount(() => {
    viewingChat.value = null;
    threadToken++;
    stopEvents?.();
    phone.removeEventListener('change', onPhoneChange);
    window.removeEventListener('resize', syncViewport);
    document.documentElement.style.overflow = '';
    window.visualViewport?.removeEventListener('resize', syncViewport);
    window.visualViewport?.removeEventListener('scroll', syncViewport);
    document.removeEventListener('visibilitychange', onVisible);
});
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_withDotValue(headerShift, {});
    __VLS_withDotValue(locked, {});
    __VLS_withDotValue(frame, {});
    __VLS_withDotValue(isPhone, {});
    __VLS_withDotValue(listLoading, {});
    __VLS_withDotValue(listFailed, {});
    __VLS_withDotValue(conversations, {});
    __VLS_withDotValue(threadMissing, {});
    __VLS_withDotValue(active, {});
    __VLS_withDotValue(isOwner, {});
    __VLS_withDotValue(infoOpen, {});
    __VLS_withDotValue(renameDraft, {});
    __VLS_withDotValue(self, {});
    __VLS_withDotValue(threadLoading, {});
    __VLS_withDotValue(hasMore, {});
    __VLS_withDotValue(messages, {});
    __VLS_withDotValue(sendError, {});
    __VLS_withDotValue(draft, {});
    void {};
    /** @type {__VLS_StyleScopedClasses['chat-pane']} */ ;
    /** @type {__VLS_StyleScopedClasses['chat-pane']} */ ;
    /** @type {__VLS_StyleScopedClasses['chat-fade']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "min-h-screen overflow-x-hidden bg-flixer-background font-sans text-flixer-text md:pb-0" },
    });
    /** @type {__VLS_StyleScopedClasses['min-h-screen']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-x-hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-sans']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-text']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:pb-0']} */ ;
    const __VLS_0 = Header;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        // @ts-ignore
        ...{ 'onLogout': {} }, docked: (isPhone.value), ...{ style: (headerShift.value ? { transform: `translateY(${headerShift.value}px)` } : undefined) }, links: (__VLS_unwrap(navLinks, {})), isSigningOut: (__VLS_unwrap(isSigningOut, {})),
    }));
    const __VLS_2 = __VLS_1({
        ...{ 'onLogout': {} },
        docked: (isPhone.value),
        ...{ style: (headerShift.value ? { transform: `translateY(${headerShift.value}px)` } : undefined) },
        links: (__VLS_unwrap(navLinks, {})),
        isSigningOut: (__VLS_unwrap(isSigningOut, {})),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    let __VLS_5;
    const __VLS_6 = {
        /** @type {typeof __VLS_5.logout} */
        onLogout: (__VLS_unwrap(signOut, {})),
    };
    void __VLS_6;
    var __VLS_3;
    var __VLS_4;
    __VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({
        ...{ class: "page-gutter pt-28 sm:pt-32" },
    });
    /** @type {__VLS_StyleScopedClasses['page-gutter']} */ ;
    /** @type {__VLS_StyleScopedClasses['pt-28']} */ ;
    /** @type {__VLS_StyleScopedClasses['sm:pt-32']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "chat-grid grid grid-rows-[minmax(0,1fr)] overflow-hidden border-white/10 md:h-[calc(100dvh-11rem)] md:grid-cols-[20rem_minmax(0,1fr)] md:rounded md:border" },
        ...{ class: (locked.value ? 'fixed inset-x-0 z-30 bg-flixer-background' : '') },
        ...{ style: (locked.value ? { top: `${frame.value.top}px`, height: `${frame.value.height}px` } : undefined) },
    });
    /** @type {__VLS_StyleScopedClasses['chat-grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['grid-rows-[minmax(0,1fr)]']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:h-[calc(100dvh-11rem)]']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:grid-cols-[20rem_minmax(0,1fr)]']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:border']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.aside, __VLS_intrinsics.aside)({
        ...{ class: "chat-pane flex min-h-0 flex-col border-white/10 bg-flixer-background max-md:absolute max-md:inset-0 md:border-r" },
        ...{ class: (props.id ? 'max-md:-translate-x-1/4 max-md:opacity-0 max-md:pointer-events-none' : '') },
        inert: (isPhone.value && !!props.id),
        'aria-label': (__VLS_unwrap(t, {})('chat.conversations')),
    });
    /** @type {__VLS_StyleScopedClasses['chat-pane']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-h-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-md:absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-md:inset-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['md:border-r']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
        ...{ class: "text-lg font-bold text-white" },
    });
    /** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    (__VLS_unwrap(t, {})('chat.title'));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (newChat) },
        type: "button",
        ...{ class: "flex items-center gap-1.5 rounded bg-white px-3 py-1.5 text-xs font-bold text-flixer-background transition hover:bg-white/85" },
    });
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
    /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-flixer-background']} */ ;
    /** @type {__VLS_StyleScopedClasses['transition']} */ ;
    /** @type {__VLS_StyleScopedClasses['hover:bg-white/85']} */ ;
    let __VLS_7;
    /** @ts-ignore @type { | typeof __VLS_components.Icon} */
    Icon;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        // @ts-ignore
        icon: "lucide:plus", ...{ class: "size-3.5" }, 'aria-hidden': "true",
    }));
    const __VLS_9 = __VLS_8({
        icon: "lucide:plus",
        ...{ class: "size-3.5" },
        'aria-hidden': "true",
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    /** @type {__VLS_StyleScopedClasses['size-3.5']} */ ;
    (__VLS_unwrap(t, {})('chat.new'));
    if (listLoading.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
            ...{ class: "space-y-1 p-2" },
        });
        /** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
        const __VLS_12 = __VLS_tryAsConstant((5));
        for (const [n] of __VLS_vFor(__VLS_nonNull(__VLS_12))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                key: (n),
                ...{ class: "flex items-center gap-3 p-2" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
            const __VLS_13 = Skeleton;
            // @ts-ignore
            const __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
                // @ts-ignore
                ...{ class: "size-10 rounded" },
            }));
            const __VLS_15 = __VLS_14({
                ...{ class: "size-10 rounded" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_14));
            /** @type {__VLS_StyleScopedClasses['size-10']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            const __VLS_18 = Skeleton;
            // @ts-ignore
            const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
                // @ts-ignore
                ...{ class: "h-4 w-32" },
            }));
            const __VLS_20 = __VLS_19({
                ...{ class: "h-4 w-32" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_19));
            /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-32']} */ ;
            // @ts-ignore
            [isPhone, isPhone, headerShift, headerShift, navLinks, isSigningOut, signOut, locked, locked, frame, frame, t, t, t, listLoading,];
        }
    }
    else if (listFailed.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "p-4 text-sm text-red-400" },
            role: "alert",
        });
        /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-400']} */ ;
        (__VLS_unwrap(t, {})('chat.loadError'));
    }
    else if (!conversations.value.length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('chat.empty'));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (newChat) },
            type: "button",
            ...{ class: "rounded bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20" },
        });
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/20']} */ ;
        (__VLS_unwrap(t, {})('chat.startChat'));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
            ...{ class: "min-h-0 flex-1 overflow-y-auto p-2" },
        });
        /** @type {__VLS_StyleScopedClasses['min-h-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-2']} */ ;
        const __VLS_23 = __VLS_tryAsConstant((conversations.value));
        for (const [conversation] of __VLS_vFor(__VLS_nonNull(__VLS_23))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                key: (conversation.id),
            });
            let __VLS_24;
            /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
            RouterLink;
            // @ts-ignore
            const __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
                // @ts-ignore
                to: ({ name: 'chat', params: { id: conversation.id } }), ...{ class: "flex items-center gap-3 rounded px-2 py-2.5 transition motion-reduce:transition-none hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" }, ...{ class: (conversation.id === props.id ? 'bg-white/10' : '') },
            }));
            const __VLS_26 = __VLS_25({
                to: ({ name: 'chat', params: { id: conversation.id } }),
                ...{ class: "flex items-center gap-3 rounded px-2 py-2.5 transition motion-reduce:transition-none hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-flixer-accent" },
                ...{ class: (conversation.id === props.id ? 'bg-white/10' : '') },
            }, ...__VLS_functionalComponentArgsRest(__VLS_25));
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['motion-reduce:transition-none']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-white/5']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus-visible:outline-flixer-accent']} */ ;
            var __VLS_27;
            const { default: __VLS_29 } = __VLS_nonNull(__VLS_27.slots);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "relative block size-11 shrink-0 overflow-hidden rounded" },
            });
            /** @type {__VLS_StyleScopedClasses['relative']} */ ;
            /** @type {__VLS_StyleScopedClasses['block']} */ ;
            /** @type {__VLS_StyleScopedClasses['size-11']} */ ;
            /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            if (conversation.kind === 'direct') {
                const __VLS_30 = UserAvatar;
                // @ts-ignore
                const __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({
                    // @ts-ignore
                    avatarUrl: (__VLS_unwrap(otherMember, {})(conversation)?.avatarUrl), name: (__VLS_unwrap(title, {})(conversation)),
                }));
                const __VLS_32 = __VLS_31({
                    avatarUrl: (__VLS_unwrap(otherMember, {})(conversation)?.avatarUrl),
                    name: (__VLS_unwrap(title, {})(conversation)),
                }, ...__VLS_functionalComponentArgsRest(__VLS_31));
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "grid size-full place-items-center bg-gradient-to-br from-flixer-primary to-flixer-secondary text-white" },
                    'aria-hidden': "true",
                });
                /** @type {__VLS_StyleScopedClasses['grid']} */ ;
                /** @type {__VLS_StyleScopedClasses['size-full']} */ ;
                /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-gradient-to-br']} */ ;
                /** @type {__VLS_StyleScopedClasses['from-flixer-primary']} */ ;
                /** @type {__VLS_StyleScopedClasses['to-flixer-secondary']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                let __VLS_35;
                /** @ts-ignore @type { | typeof __VLS_components.Icon} */
                Icon;
                // @ts-ignore
                const __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35({
                    // @ts-ignore
                    icon: "lucide:users-round", ...{ class: "size-5" }, 'aria-hidden': "true",
                }));
                const __VLS_37 = __VLS_36({
                    icon: "lucide:users-round",
                    ...{ class: "size-5" },
                    'aria-hidden': "true",
                }, ...__VLS_functionalComponentArgsRest(__VLS_36));
                /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "min-w-0 flex-1" },
            });
            /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "flex items-baseline justify-between gap-2" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-baseline']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "truncate text-sm text-white" },
                ...{ class: (conversation.unread ? 'font-bold' : 'font-medium') },
            });
            /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            (__VLS_unwrap(title, {})(conversation));
            if (conversation.lastMessage) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "shrink-0 text-[11px] text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-[11px]']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (shortTime(conversation.lastMessage.createdAt));
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "flex items-center justify-between gap-2" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "truncate text-xs" },
                ...{ class: (conversation.unread ? 'text-white' : 'text-flixer-muted') },
            });
            /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            (preview(conversation));
            if (conversation.unread) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "grid min-w-4 shrink-0 place-items-center rounded bg-flixer-accent px-1 text-[10px] font-bold leading-4 text-flixer-background" },
                });
                /** @type {__VLS_StyleScopedClasses['grid']} */ ;
                /** @type {__VLS_StyleScopedClasses['min-w-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-flixer-accent']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
                /** @type {__VLS_StyleScopedClasses['leading-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-background']} */ ;
                (conversation.unread > 99 ? '99+' : conversation.unread);
            }
            // @ts-ignore
            [t, t, t, listFailed, conversations, conversations, otherMember, title, title,];
            // @ts-ignore
            [];
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "chat-pane flex min-h-0 min-w-0 flex-col bg-flixer-background max-md:absolute max-md:inset-0" },
        ...{ class: (props.id ? '' : 'max-md:translate-x-full max-md:pointer-events-none') },
        inert: (isPhone.value && !props.id),
        'aria-label': (__VLS_unwrap(t, {})('chat.thread')),
    });
    /** @type {__VLS_StyleScopedClasses['chat-pane']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-h-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-md:absolute']} */ ;
    /** @type {__VLS_StyleScopedClasses['max-md:inset-0']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (props.id ?? 'none'),
        ...{ class: "chat-fade flex min-h-0 flex-1 flex-col" },
    });
    /** @type {__VLS_StyleScopedClasses['chat-fade']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['min-h-0']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
    if (!props.id) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "m-auto p-6 text-center text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['m-auto']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('chat.selectPrompt'));
    }
    else if (threadMissing.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "m-auto p-6 text-center" },
        });
        /** @type {__VLS_StyleScopedClasses['m-auto']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "text-sm text-flixer-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
        (__VLS_unwrap(t, {})('chat.notFound'));
        let __VLS_40;
        /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
        RouterLink;
        // @ts-ignore
        const __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40({
            // @ts-ignore
            to: ({ name: 'chat' }), ...{ class: "mt-3 inline-block rounded bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20" },
        }));
        const __VLS_42 = __VLS_41({
            to: ({ name: 'chat' }),
            ...{ class: "mt-3 inline-block rounded bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_41));
        /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['inline-block']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/20']} */ ;
        var __VLS_43;
        const { default: __VLS_45 } = __VLS_nonNull(__VLS_43.slots);
        (__VLS_unwrap(t, {})('chat.back'));
        // @ts-ignore
        [isPhone, t, t, t, t, threadMissing,];
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
            ...{ class: "flex items-center gap-3 border-b border-white/10 px-3 py-3 sm:px-4" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:px-4']} */ ;
        let __VLS_46;
        /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
        RouterLink;
        // @ts-ignore
        const __VLS_47 = __VLS_asFunctionalComponent1(__VLS_46, new __VLS_46({
            // @ts-ignore
            to: ({ name: 'chat' }), ...{ class: "grid size-9 shrink-0 place-items-center rounded text-white/80 transition hover:bg-white/10 md:hidden" }, 'aria-label': (__VLS_unwrap(t, {})('chat.back')),
        }));
        const __VLS_48 = __VLS_47({
            to: ({ name: 'chat' }),
            ...{ class: "grid size-9 shrink-0 place-items-center rounded text-white/80 transition hover:bg-white/10 md:hidden" },
            'aria-label': (__VLS_unwrap(t, {})('chat.back')),
        }, ...__VLS_functionalComponentArgsRest(__VLS_47));
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['size-9']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white/80']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:hidden']} */ ;
        var __VLS_49;
        const { default: __VLS_51 } = __VLS_nonNull(__VLS_49.slots);
        let __VLS_52;
        /** @ts-ignore @type { | typeof __VLS_components.Icon} */
        Icon;
        // @ts-ignore
        const __VLS_53 = __VLS_asFunctionalComponent1(__VLS_52, new __VLS_52({
            // @ts-ignore
            icon: "lucide:chevron-left", ...{ class: "size-5" }, 'aria-hidden': "true",
        }));
        const __VLS_54 = __VLS_53({
            icon: "lucide:chevron-left",
            ...{ class: "size-5" },
            'aria-hidden': "true",
        }, ...__VLS_functionalComponentArgsRest(__VLS_53));
        /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
        // @ts-ignore
        [t,];
        if (active.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "block size-9 shrink-0 overflow-hidden rounded" },
            });
            /** @type {__VLS_StyleScopedClasses['block']} */ ;
            /** @type {__VLS_StyleScopedClasses['size-9']} */ ;
            /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            if (active.value.kind === 'direct') {
                const __VLS_57 = UserAvatar;
                // @ts-ignore
                const __VLS_58 = __VLS_asFunctionalComponent1(__VLS_57, new __VLS_57({
                    // @ts-ignore
                    avatarUrl: (__VLS_unwrap(otherMember, {})(active.value)?.avatarUrl), name: (__VLS_unwrap(title, {})(active.value)),
                }));
                const __VLS_59 = __VLS_58({
                    avatarUrl: (__VLS_unwrap(otherMember, {})(active.value)?.avatarUrl),
                    name: (__VLS_unwrap(title, {})(active.value)),
                }, ...__VLS_functionalComponentArgsRest(__VLS_58));
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "grid size-full place-items-center bg-gradient-to-br from-flixer-primary to-flixer-secondary text-white" },
                    'aria-hidden': "true",
                });
                /** @type {__VLS_StyleScopedClasses['grid']} */ ;
                /** @type {__VLS_StyleScopedClasses['size-full']} */ ;
                /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-gradient-to-br']} */ ;
                /** @type {__VLS_StyleScopedClasses['from-flixer-primary']} */ ;
                /** @type {__VLS_StyleScopedClasses['to-flixer-secondary']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                let __VLS_62;
                /** @ts-ignore @type { | typeof __VLS_components.Icon} */
                Icon;
                // @ts-ignore
                const __VLS_63 = __VLS_asFunctionalComponent1(__VLS_62, new __VLS_62({
                    // @ts-ignore
                    icon: "lucide:users-round", ...{ class: "size-4" }, 'aria-hidden': "true",
                }));
                const __VLS_64 = __VLS_63({
                    icon: "lucide:users-round",
                    ...{ class: "size-4" },
                    'aria-hidden': "true",
                }, ...__VLS_functionalComponentArgsRest(__VLS_63));
                /** @type {__VLS_StyleScopedClasses['size-4']} */ ;
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "min-w-0 flex-1" },
            });
            /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
            if (active.value.kind === 'direct') {
                let __VLS_67;
                /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
                RouterLink;
                // @ts-ignore
                const __VLS_68 = __VLS_asFunctionalComponent1(__VLS_67, new __VLS_67({
                    // @ts-ignore
                    to: ({ name: 'profile', params: { username: __VLS_unwrap(otherMember, {})(active.value)?.username } }), ...{ class: "block truncate text-sm font-semibold text-white hover:underline" },
                }));
                const __VLS_69 = __VLS_68({
                    to: ({ name: 'profile', params: { username: __VLS_unwrap(otherMember, {})(active.value)?.username } }),
                    ...{ class: "block truncate text-sm font-semibold text-white hover:underline" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_68));
                /** @type {__VLS_StyleScopedClasses['block']} */ ;
                /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:underline']} */ ;
                var __VLS_70;
                const { default: __VLS_72 } = __VLS_nonNull(__VLS_70.slots);
                (__VLS_unwrap(title, {})(active.value));
                // @ts-ignore
                [otherMember, otherMember, title, title, active, active, active, active, active, active, active,];
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
                    ...{ class: "truncate text-sm font-semibold text-white" },
                });
                /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                (__VLS_unwrap(title, {})(active.value));
            }
            if (active.value.kind === 'group') {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "truncate text-xs text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (__VLS_unwrap(t, {})('chat.memberCount', { count: active.value.members.length }, active.value.members.length));
            }
            if (active.value.kind === 'direct' || isOwner.value) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (deleteActive) },
                    type: "button",
                    ...{ class: "grid size-9 shrink-0 place-items-center rounded text-white/80 transition hover:bg-white/10 hover:text-red-400" },
                    'aria-label': (active.value.kind === 'group' ? __VLS_unwrap(t, {})('chat.deleteGroup') : __VLS_unwrap(t, {})('chat.deleteChat')),
                    title: (active.value.kind === 'group' ? __VLS_unwrap(t, {})('chat.deleteGroup') : __VLS_unwrap(t, {})('chat.deleteChat')),
                });
                /** @type {__VLS_StyleScopedClasses['grid']} */ ;
                /** @type {__VLS_StyleScopedClasses['size-9']} */ ;
                /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-white/80']} */ ;
                /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:text-red-400']} */ ;
                let __VLS_73;
                /** @ts-ignore @type { | typeof __VLS_components.Icon} */
                Icon;
                // @ts-ignore
                const __VLS_74 = __VLS_asFunctionalComponent1(__VLS_73, new __VLS_73({
                    // @ts-ignore
                    icon: "lucide:trash", ...{ class: "size-5" }, 'aria-hidden': "true",
                }));
                const __VLS_75 = __VLS_74({
                    icon: "lucide:trash",
                    ...{ class: "size-5" },
                    'aria-hidden': "true",
                }, ...__VLS_functionalComponentArgsRest(__VLS_74));
                /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
            }
            if (active.value.kind === 'group') {
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            void $event;
                            if (!!(!props.id))
                                throw 0;
                            if (!!(threadMissing.value))
                                throw 0;
                            if (!(active.value))
                                throw 0;
                            if (!(active.value.kind === 'group'))
                                throw 0;
                            return (infoOpen.value = !infoOpen.value);
                            // @ts-ignore
                            [t, t, t, t, t, title, active, active, active, active, active, active, active, active, isOwner, infoOpen, infoOpen,];
                        } },
                    type: "button",
                    ...{ class: "grid size-9 shrink-0 place-items-center rounded text-white/80 transition hover:bg-white/10 hover:text-white" },
                    ...{ class: (infoOpen.value ? 'bg-white/10' : '') },
                    'aria-label': (__VLS_unwrap(t, {})('chat.groupInfo')),
                    'aria-expanded': (infoOpen.value),
                });
                /** @type {__VLS_StyleScopedClasses['grid']} */ ;
                /** @type {__VLS_StyleScopedClasses['size-9']} */ ;
                /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-white/80']} */ ;
                /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:text-white']} */ ;
                let __VLS_78;
                /** @ts-ignore @type { | typeof __VLS_components.Icon} */
                Icon;
                // @ts-ignore
                const __VLS_79 = __VLS_asFunctionalComponent1(__VLS_78, new __VLS_78({
                    // @ts-ignore
                    icon: "lucide:circle-question-mark", ...{ class: "size-5" }, 'aria-hidden': "true",
                }));
                const __VLS_80 = __VLS_79({
                    icon: "lucide:circle-question-mark",
                    ...{ class: "size-5" },
                    'aria-hidden': "true",
                }, ...__VLS_functionalComponentArgsRest(__VLS_79));
                /** @type {__VLS_StyleScopedClasses['size-5']} */ ;
            }
        }
        else {
            const __VLS_83 = Skeleton;
            // @ts-ignore
            const __VLS_84 = __VLS_asFunctionalComponent1(__VLS_83, new __VLS_83({
                // @ts-ignore
                ...{ class: "h-5 w-40" },
            }));
            const __VLS_85 = __VLS_84({
                ...{ class: "h-5 w-40" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_84));
            /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-40']} */ ;
        }
        if (infoOpen.value && active.value?.kind === 'group') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "max-h-64 shrink-0 space-y-3 overflow-y-auto border-b border-white/10 bg-white/[0.03] p-4" },
            });
            /** @type {__VLS_StyleScopedClasses['max-h-64']} */ ;
            /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-b']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white/[0.03]']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
                ...{ onSubmit: (rename) },
                ...{ class: "flex gap-2" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
                maxlength: "60",
                ...{ class: "min-w-0 flex-1 rounded border border-flixer-border bg-flixer-background px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-flixer-accent" },
                'aria-label': (__VLS_unwrap(t, {})('chat.groupName')),
            });
            (renameDraft.value);
            /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-background']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['focus:ring-flixer-accent']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                type: "submit",
                ...{ class: "rounded bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 disabled:opacity-50" },
                disabled: (!renameDraft.value.trim() || renameDraft.value.trim() === active.value.name),
            });
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
            /** @type {__VLS_StyleScopedClasses['transition']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:bg-white/20']} */ ;
            /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
            (__VLS_unwrap(t, {})('chat.rename'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex items-center justify-between" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
                ...{ class: "text-xs font-semibold uppercase tracking-wide text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
            /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('chat.members'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (addPeople) },
                type: "button",
                ...{ class: "text-xs font-semibold text-flixer-accent hover:underline" },
            });
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-accent']} */ ;
            /** @type {__VLS_StyleScopedClasses['hover:underline']} */ ;
            (__VLS_unwrap(t, {})('chat.addPeople'));
            __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
                ...{ class: "space-y-1" },
            });
            /** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
            const __VLS_88 = __VLS_tryAsConstant((active.value.members));
            for (const [member] of __VLS_vFor(__VLS_nonNull(__VLS_88))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                    key: (member.username),
                    ...{ class: "flex items-center gap-3" },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "block size-7 shrink-0 overflow-hidden rounded" },
                });
                /** @type {__VLS_StyleScopedClasses['block']} */ ;
                /** @type {__VLS_StyleScopedClasses['size-7']} */ ;
                /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                const __VLS_89 = UserAvatar;
                // @ts-ignore
                const __VLS_90 = __VLS_asFunctionalComponent1(__VLS_89, new __VLS_89({
                    // @ts-ignore
                    avatarUrl: (member.avatarUrl), name: (member.displayName), ...{ class: "text-xs" },
                }));
                const __VLS_91 = __VLS_90({
                    avatarUrl: (member.avatarUrl),
                    name: (member.displayName),
                    ...{ class: "text-xs" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_90));
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                let __VLS_94;
                /** @ts-ignore @type { | typeof RouterLink | typeof RouterLink} */
                RouterLink;
                // @ts-ignore
                const __VLS_95 = __VLS_asFunctionalComponent1(__VLS_94, new __VLS_94({
                    // @ts-ignore
                    to: ({ name: 'profile', params: { username: member.username } }), ...{ class: "min-w-0 flex-1 truncate text-sm text-white hover:underline" },
                }));
                const __VLS_96 = __VLS_95({
                    to: ({ name: 'profile', params: { username: member.username } }),
                    ...{ class: "min-w-0 flex-1 truncate text-sm text-white hover:underline" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_95));
                /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:underline']} */ ;
                var __VLS_97;
                const { default: __VLS_99 } = __VLS_nonNull(__VLS_97.slots);
                (member.displayName);
                // @ts-ignore
                [t, t, t, t, t, active, active, active, infoOpen, infoOpen, infoOpen, renameDraft, renameDraft, renameDraft,];
                if (member.role === 'owner') {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                        ...{ class: "rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-flixer-muted" },
                    });
                    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                    /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
                    /** @type {__VLS_StyleScopedClasses['px-1.5']} */ ;
                    /** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
                    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                    /** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
                    /** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                    (__VLS_unwrap(t, {})('chat.owner'));
                }
                if (isOwner.value && member.username !== self.value) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                        ...{ onClick: (...[$event]) => {
                                void $event;
                                if (!!(!props.id))
                                    throw 0;
                                if (!!(threadMissing.value))
                                    throw 0;
                                if (!(infoOpen.value && active.value?.kind === 'group'))
                                    throw 0;
                                if (!(isOwner.value && member.username !== self.value))
                                    throw 0;
                                return (leaveOrRemove(member.username));
                                // @ts-ignore
                                [t, isOwner, self,];
                            } },
                        type: "button",
                        ...{ class: "text-xs font-semibold text-red-400 hover:underline" },
                    });
                    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                    /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-red-400']} */ ;
                    /** @type {__VLS_StyleScopedClasses['hover:underline']} */ ;
                    (__VLS_unwrap(t, {})('chat.remove'));
                }
                // @ts-ignore
                [t,];
            }
            if (self.value) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            void $event;
                            if (!!(!props.id))
                                throw 0;
                            if (!!(threadMissing.value))
                                throw 0;
                            if (!(infoOpen.value && active.value?.kind === 'group'))
                                throw 0;
                            if (!(self.value))
                                throw 0;
                            return (leaveOrRemove(self.value));
                            // @ts-ignore
                            [self, self,];
                        } },
                    type: "button",
                    ...{ class: "text-xs font-semibold text-red-400 hover:underline" },
                });
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-red-400']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:underline']} */ ;
                (__VLS_unwrap(t, {})('chat.leaveGroup'));
            }
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ref: "scroller",
            ...{ class: "min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4 sm:px-4" },
            role: "log",
            'aria-live': "polite",
            'aria-label': (__VLS_unwrap(t, {})('chat.messages')),
        });
        /** @type {__VLS_StyleScopedClasses['min-h-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['sm:px-4']} */ ;
        if (threadLoading.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "py-8 text-center text-sm text-flixer-muted" },
            });
            /** @type {__VLS_StyleScopedClasses['py-8']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
            (__VLS_unwrap(t, {})('common.loading'));
        }
        else {
            if (hasMore.value) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (loadEarlier) },
                    type: "button",
                    ...{ class: "mx-auto mb-3 block rounded bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20" },
                });
                /** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
                /** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['block']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
                /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                /** @type {__VLS_StyleScopedClasses['transition']} */ ;
                /** @type {__VLS_StyleScopedClasses['hover:bg-white/20']} */ ;
                (__VLS_unwrap(t, {})('chat.loadEarlier'));
            }
            if (!messages.value.length) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                    ...{ class: "py-8 text-center text-sm text-flixer-muted" },
                });
                /** @type {__VLS_StyleScopedClasses['py-8']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                (__VLS_unwrap(t, {})('chat.sayHello'));
            }
            const __VLS_100 = __VLS_tryAsConstant((messages.value));
            for (const [message, index] of __VLS_vFor(__VLS_nonNull(__VLS_100))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.template)({
                    key: (message.id),
                });
                if (message.kind === 'system') {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                        ...{ class: "py-1 text-center text-xs text-flixer-muted" },
                    });
                    /** @type {__VLS_StyleScopedClasses['py-1']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                    (message.sender ? `${message.sender.displayName} ` : '');
                    (message.body);
                }
                else {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "flex" },
                        ...{ class: (message.sender?.username === self.value ? 'justify-end' : 'justify-start') },
                    });
                    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                        ...{ class: "max-w-[85%] sm:max-w-[70%]" },
                    });
                    /** @type {__VLS_StyleScopedClasses['max-w-[85%]']} */ ;
                    /** @type {__VLS_StyleScopedClasses['sm:max-w-[70%]']} */ ;
                    if (active.value?.kind === 'group' && message.sender?.username !== self.value && messages.value[index - 1]?.sender?.username !== message.sender?.username) {
                        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                            ...{ class: "mb-0.5 px-1 text-xs font-semibold text-flixer-muted" },
                        });
                        /** @type {__VLS_StyleScopedClasses['mb-0.5']} */ ;
                        /** @type {__VLS_StyleScopedClasses['px-1']} */ ;
                        /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
                        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
                        /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                        (message.sender?.displayName);
                    }
                    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                        ...{ class: "whitespace-pre-wrap break-words rounded px-3 py-2 text-sm" },
                        ...{ class: (message.sender?.username === self.value ? 'bg-flixer-accent text-flixer-background' : 'bg-white/10 text-white') },
                        title: (__VLS_unwrap(fullTime, {})(message.createdAt)),
                    });
                    /** @type {__VLS_StyleScopedClasses['whitespace-pre-wrap']} */ ;
                    /** @type {__VLS_StyleScopedClasses['break-words']} */ ;
                    /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                    /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
                    /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
                    (message.body);
                    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                        ...{ class: "mt-0.5 px-1 text-[10px] text-flixer-muted" },
                        ...{ class: (message.sender?.username === self.value ? 'text-right' : '') },
                    });
                    /** @type {__VLS_StyleScopedClasses['mt-0.5']} */ ;
                    /** @type {__VLS_StyleScopedClasses['px-1']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-flixer-muted']} */ ;
                    (shortTime(message.createdAt));
                }
                // @ts-ignore
                [t, t, t, t, t, active, self, self, self, self, threadLoading, hasMore, messages, messages, messages, fullTime,];
            }
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
            ...{ onSubmit: (send) },
            ...{ class: "border-t border-white/10 p-3" },
        });
        /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
        if (sendError.value) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
                ...{ class: "mb-2 text-xs text-red-400" },
                role: "alert",
            });
            /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-red-400']} */ ;
            (sendError.value);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex items-end gap-2" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-end']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.textarea, __VLS_intrinsics.textarea)({
            ...{ onKeydown: (onComposerKey) },
            ...{ onFocus: (onComposerFocus) },
            ...{ onBlur: (onComposerBlur) },
            ref: "composer",
            value: (draft.value),
            rows: "1",
            maxlength: "2000",
            ...{ class: "max-h-32 min-h-10 min-w-0 flex-1 resize-none rounded border border-white/10 bg-white/5 px-3 py-2 text-base text-white placeholder:text-flixer-muted focus:outline-none focus:ring-2 focus:ring-flixer-accent" },
            placeholder: (__VLS_unwrap(t, {})('chat.writeMessage')),
            'aria-label': (__VLS_unwrap(t, {})('chat.writeMessage')),
        });
        /** @type {__VLS_StyleScopedClasses['max-h-32']} */ ;
        /** @type {__VLS_StyleScopedClasses['min-h-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['resize-none']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['border']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white/5']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-base']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['placeholder:text-flixer-muted']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['focus:ring-flixer-accent']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            type: "submit",
            ...{ class: "h-10 shrink-0 rounded bg-white px-4 text-sm font-bold text-flixer-background transition hover:bg-white/85 disabled:opacity-50" },
            disabled: (!draft.value.trim() || __VLS_unwrap(sending, {})),
        });
        /** @type {__VLS_StyleScopedClasses['h-10']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['px-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-flixer-background']} */ ;
        /** @type {__VLS_StyleScopedClasses['transition']} */ ;
        /** @type {__VLS_StyleScopedClasses['hover:bg-white/85']} */ ;
        /** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
        (__VLS_unwrap(t, {})('chat.send'));
    }
    // @ts-ignore
    [t, t, t, sendError, sendError, draft, draft, sending,];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
