import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { createAgent } from "@ui-sdk/vue/agent";
import { expect, mocked, userEvent } from "storybook/test";
import { listSettings, updateSetting } from "../../api";
import { serverSettings } from "../../storybook/fixturesAdminAB";
import ServerSettingsSection from "./ServerSettingsSection.vue";

const meta = {
	title: "Admin/ServerSettingsSection",
	component: ServerSettingsSection,
	tags: ["autodocs"],
	render: () => ({ components: { ServerSettingsSection }, template: '<div class="w-[40rem]"><ServerSettingsSection /></div>' }),
	beforeEach: () => {
		mocked(listSettings).mockResolvedValue(serverSettings);
		mocked(updateSetting).mockResolvedValue(serverSettings[0]);
	},
} satisfies Meta<typeof ServerSettingsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvas }) => {
		const serverName = await canvas.findByRole("textbox", { name: /server name/i });
		const banner = canvas.getByRole("textbox", { name: /login banner/i });
		await expect(serverName).toHaveValue("Flixer Home");
		await expect(banner).toHaveValue("Welcome back!");
		const agent = createAgent();
		await expect(agent.snapshot().some((entry) => entry.component === "input" && /server name/i.test(entry.label ?? ""))).toBe(true);
		const result = await agent.act({ steps: [{ ref: "Server name", action: "setValue", args: ["Agent Server"] }] });
		await expect(result.ok, result.error?.message).toBe(true);
		await expect(serverName).toHaveValue("Agent Server");
		await userEvent.click(canvas.getByText(/server name/i));
		await expect(serverName).toHaveFocus();
		await userEvent.clear(serverName);
		await userEvent.type(serverName, "  New Server  ");
		await userEvent.clear(banner);
		await userEvent.type(banner, "  Maintenance tonight  ");
		await userEvent.click(canvas.getByRole("button", { name: /save/i }));
		await expect(mocked(updateSetting)).toHaveBeenCalledWith("server_name", "New Server");
		await expect(mocked(updateSetting)).toHaveBeenCalledWith("login_banner", "Maintenance tonight");
	},
};
export const Empty: Story = { beforeEach: () => void mocked(listSettings).mockResolvedValue([]) };
export const Loading: Story = { beforeEach: () => void mocked(listSettings).mockReturnValue(new Promise(() => undefined)) };
export const LoadError: Story = { beforeEach: () => void mocked(listSettings).mockRejectedValue(new Error("Network error")) };
