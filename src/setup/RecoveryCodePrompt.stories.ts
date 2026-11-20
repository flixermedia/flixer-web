import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { createAgent } from "@ui-sdk/vue/agent";
import { expect, fn, userEvent } from "storybook/test";
import RecoveryCodePrompt from "./RecoveryCodePrompt.vue";

const meta = {
	title: "Setup/RecoveryCodePrompt",
	component: RecoveryCodePrompt,
	args: { message: "", onSubmit: fn() },
} satisfies Meta<typeof RecoveryCodePrompt>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HumanOnly: Story = {
	play: async ({ args, canvas }) => {
		const input = canvas.getByPlaceholderText("ABCD-EFGH-JKMN-PQRS");
		const submit = canvas.getByRole("button", { name: "Continue" });
		await expect(submit).toBeDisabled();
		await userEvent.type(input, " ABCD-EFGH-JKMN-PQRS ");
		const agent = createAgent();
		await expect(agent.snapshot()).toEqual([]);
		const denied = await agent.act({ steps: [{ ref: "Continue", action: "press" }] });
		await expect(denied.ok).toBe(false);
		await expect(args.onSubmit).not.toHaveBeenCalled();
		await userEvent.keyboard("{Enter}");
		await expect(args.onSubmit).toHaveBeenCalledWith("ABCD-EFGH-JKMN-PQRS");
	},
};
