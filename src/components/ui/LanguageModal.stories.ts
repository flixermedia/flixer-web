import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { closeModalsByGroup } from "@kolirt/vue-modal";
import { createAgent } from "@ui-sdk/vue/agent";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { modalStory } from "../../storybook/modalStory";
import LanguageModal from "./LanguageModal.vue";

const meta = {
	title: "UI/LanguageModal",
	component: LanguageModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	beforeEach: () => async () => { await closeModalsByGroup("default", { instantExit: true }); },
	render: (args) => modalStory(LanguageModal, args)(),
} satisfies Meta<typeof LanguageModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SearchInteraction: Story = {
	play: async () => {
		const page = within(document.body);
		const search = await page.findByRole("searchbox", { name: "Search Languages" });
		const agent = createAgent();
		const result = await agent.act({ steps: [{ ref: "Search Languages", action: "setValue", args: ["zz-no-such-language"] }] });
		await expect(result.ok, result.error?.message).toBe(true);
		await expect(search).toHaveValue("zz-no-such-language");
		await expect(page.getByText("No languages match your search.")).toBeInTheDocument();
		await userEvent.click(page.getByRole("button", { name: "Close" }));
		await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
	},
};
