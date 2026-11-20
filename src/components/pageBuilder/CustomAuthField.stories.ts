import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { createAgent } from "@ui-sdk/vue/agent";
import { expect, fn, userEvent } from "storybook/test";
import { ref } from "vue";
import CustomAuthField from "./CustomAuthField.vue";

const submit = fn();
const quickConnect = fn();
const meta = {
	title: "Page Builder/Custom Auth Fields",
	beforeEach: () => { submit.mockClear(); quickConnect.mockClear(); },
	render: () => ({
		components: { CustomAuthField },
		setup: () => ({
			model: ref({ username: "", password: "", email: "", displayName: "" }),
			fields: ["username", "password", "submit", "quickConnect"],
			submit,
			quickConnect,
		}),
		template: `
			<form id="custom-auth-form" @submit.prevent="submit(model.username)"></form>
			<CustomAuthField v-for="field in fields" :key="field" v-model="model" :field="field"
				:registration="false" :registration-enabled="true" :quick-connect-enabled="true"
				:submitting="false" :needs-verification="false" :resending="false" @quick-connect="quickConnect()" />
		`,
	}),
} satisfies Meta;
export default meta;

export const ExternalForm: StoryObj<typeof meta> = {
	play: async ({ canvas }) => {
		const signIn = canvas.getByRole<HTMLButtonElement>("button", { name: "Sign in to Flixer" });
		const quick = canvas.getByRole("button", { name: "Sign in with Quick Connect" });
		const agent = createAgent();
		const labels = agent.snapshot().filter((entry) => !entry.offPage).map((entry) => entry.label);
		await expect(labels).not.toContain("Sign in to Flixer");
		await expect(labels).not.toContain("Sign in with Quick Connect");
		await expect((await agent.act({ steps: [{ ref: "Sign in with Quick Connect", action: "press" }] })).ok).toBe(false);
		await expect(quickConnect).not.toHaveBeenCalled();
		await expect(signIn.form?.id).toBe("custom-auth-form");
		await expect(signIn.form?.checkValidity()).toBe(false);
		signIn.click();
		await expect(submit).not.toHaveBeenCalled();
		await userEvent.type(canvas.getByLabelText("Username"), "story-user");
		await userEvent.type(canvas.getByLabelText("Password"), "story-password");
		await expect(signIn.form?.checkValidity()).toBe(true);
		signIn.click();
		await expect(submit).toHaveBeenCalledTimes(1);
		await expect(submit).toHaveBeenCalledWith("story-user");
		await userEvent.click(quick);
		await expect(quickConnect).toHaveBeenCalledTimes(1);
	},
};
