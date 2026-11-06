import { openModal } from "@kolirt/vue-modal";
import { onMounted, type Component } from "vue";

/**
 * Story `render` for a modal component: opens it as soon as the story mounts and offers a button to reopen it after it is closed.
 * Usage: `render: modalStory(ConfirmModal, { message: "Delete?" })`.
 */
export function modalStory(component: Component, props: object = {}) {
	return () => ({
		setup() {
			const open = () => void openModal(component, { props }).catch(() => undefined);
			onMounted(open);
			return { open };
		},
		template: '<button type="button" class="rounded border border-flixer-border px-4 py-2 text-sm" @click="open">Reopen modal</button>',
	});
}
