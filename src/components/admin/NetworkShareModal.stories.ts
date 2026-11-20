import { closeModalsByGroup } from "@kolirt/vue-modal";
import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { createAgent } from "@ui-sdk/vue/agent";
import { expect, mocked, userEvent, waitFor, within } from "storybook/test";
import { createNetworkShare, updateNetworkShare } from "../../api";
import { networkShares } from "../../storybook/fixturesMediaAdmin";
import { modalStory } from "../../storybook/modalStory";
import NetworkShareModal from "./NetworkShareModal.vue";

const meta = {
	title: "Admin/NetworkShareModal",
	component: NetworkShareModal,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	render: (args) => modalStory(NetworkShareModal, args)(),
	beforeEach: () => {
		mocked(createNetworkShare).mockResolvedValue(networkShares[0]);
		mocked(updateNetworkShare).mockResolvedValue(networkShares[0]);
		return async () => { await closeModalsByGroup("default", { instantExit: true }); };
	},
} satisfies Meta<typeof NetworkShareModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const New: Story = {};
export const Edit: Story = { args: { share: networkShares[0] } };
export const SaveError: Story = {
	args: { share: networkShares[1] },
	beforeEach: () => {
		mocked(updateNetworkShare).mockRejectedValue(new Error("Could not connect to the share"));
	},
};

export const FormInteraction: Story = {
	play: async () => {
		const page = within(document.body);
		const form = within(await page.findByRole("dialog"));
		const name = form.getByRole("textbox", { name: /^Name$/ });
		const readOnly = form.getByRole("checkbox", { name: "Read-only (recommended)" });
		const save = form.getByRole("button", { name: "Connect and Save" });
		mocked(createNetworkShare).mockClear();
		await expect(name).toHaveAttribute("maxlength", "100");
		await userEvent.click(save);
		await waitFor(() => expect(name).toHaveFocus());
		await expect(mocked(createNetworkShare)).not.toHaveBeenCalled();
		await userEvent.click(form.getByText("Read-only (recommended)"));
		await expect(readOnly).not.toBeChecked();
		readOnly.focus();
		await userEvent.keyboard(" ");
		await expect(readOnly).toBeChecked();

		const agent = createAgent();
		const entries = agent.snapshot();
		await expect(entries.some((entry) => entry.label === "Name")).toBe(true);
		await expect(entries.some((entry) => entry.label === "Connect and Save" || entry.label === "Password")).toBe(false);

		await userEvent.type(name, "  Archive  ");
		await userEvent.selectOptions(form.getByRole("combobox", { name: "Protocol" }), "nfs");
		await expect(form.queryByRole("checkbox")).not.toBeInTheDocument();
		await userEvent.type(form.getByRole("textbox", { name: "Server" }), "nas.local");
		await userEvent.type(form.getByRole("textbox", { name: "NFS export path" }), "/exports/archive{Enter}");
		await waitFor(() => expect(mocked(createNetworkShare)).toHaveBeenCalledWith({
			name: "Archive", protocol: "nfs", host: "nas.local", share: "/exports/archive",
			username: "", password: "", domain: "", region: "", readOnly: true,
		}));
		await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
	},
};
