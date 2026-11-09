import { ModalClosedError, openModal } from "@kolirt/vue-modal";
import PasswordPromptModal from "../components/ui/PasswordPromptModal.vue";

export interface PasswordPromptOptions {
	title: string;
	description: string;
	passwordLabel: string;
	submitLabel: string;
	danger?: boolean;
}

export async function requestPassword(options: PasswordPromptOptions): Promise<string | null> {
	try {
		return await openModal<string>(PasswordPromptModal, { group: "default", props: options });
	} catch (error) {
		if (error instanceof ModalClosedError) return null;
		throw error;
	}
}
