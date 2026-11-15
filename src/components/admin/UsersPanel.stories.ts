import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, mocked, userEvent, waitFor, within } from "storybook/test";
import { deleteAdminUser, listAdminUsers, listSettings, updateAdminUser, updateSetting } from "../../api";
import { getMailStatus } from "../../api/mail";
import { setPaymentStatus } from "../../storybook/paymentsMocks";
import { adminUsers, serverSettings } from "../../storybook/fixturesAdminAB";
import UsersPanel from "./UsersPanel.vue";

const securitySettings = [
	{ key: "login_security", value: { timingEnabled: true, minimumMs: 400, jitterMs: 40, throttleEnabled: true, ipLimit: 20, usernameLimit: 10, windowSeconds: 60 }, isPublic: false, updatedAt: "2026-10-01T10:00:00.000Z" },
	{ key: "trusted_proxies", value: { enabled: false, addresses: [] }, isPublic: false, updatedAt: "2026-10-01T10:00:00.000Z" },
];

const meta = {
	title: "Admin/UsersPanel",
	component: UsersPanel,
	tags: ["autodocs"],
	render: () => ({ components: { UsersPanel }, template: '<div class="max-w-4xl"><UsersPanel /></div>' }),
	beforeEach: async () => {
		await setPaymentStatus({ enabled: false });
		mocked(listAdminUsers).mockResolvedValue(adminUsers);
		mocked(listSettings).mockResolvedValue([...serverSettings, ...securitySettings]);
		mocked(updateSetting).mockResolvedValue(serverSettings[0]);
		mocked(getMailStatus).mockRejectedValue(new Error("Mail is not configured"));
	},
} satisfies Meta<typeof UsersPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvas }) => {
		await expect(await canvas.findByText("Admin", { selector: "span" })).toBeVisible();
	},
};
export const NoUsers: Story = { beforeEach: () => void mocked(listAdminUsers).mockResolvedValue([]) };
export const Loading: Story = { beforeEach: () => void mocked(listAdminUsers).mockReturnValue(new Promise(() => undefined)) };
export const LoadError: Story = { beforeEach: () => void mocked(listAdminUsers).mockRejectedValue(new Error("Network error")) };
export const WithPayments: Story = { beforeEach: async () => void (await setPaymentStatus()) };

export const SecurityControls: Story = {
	beforeEach: () => {
		mocked(updateSetting).mockImplementation(async (key, value) => ({ key, value, isPublic: false, updatedAt: "2026-10-01T10:00:00.000Z" }));
	},
	play: async ({ canvas }) => {
		const timing = await canvas.findByRole("switch", { name: "Equalize failed login timing" });
		const throttle = canvas.getByRole("switch", { name: "Limit failed login attempts" });
		await userEvent.click(timing);
		await userEvent.click(throttle);
		await expect(canvas.getByLabelText("Minimum response time (ms)")).toBeDisabled();
		await userEvent.click(canvas.getByRole("button", { name: "Save login protection" }));
		const dialog = within(document.body);
		await expect(await dialog.findByText(/Reduce login protection/)).toBeInTheDocument();
		await expect(mocked(updateSetting)).not.toHaveBeenCalled();
		await userEvent.click(dialog.getByRole("button", { name: "Confirm" }));
		await waitFor(() =>
			expect(mocked(updateSetting)).toHaveBeenCalledWith("login_security", {
				timingEnabled: false,
				minimumMs: 400,
				jitterMs: 40,
				throttleEnabled: false,
				ipLimit: 20,
				usernameLimit: 10,
				windowSeconds: 60,
			}),
		);

		await userEvent.type(canvas.getByLabelText("Trusted IP addresses or CIDRs, one per line"), "192.0.2.0/24");
		await userEvent.click(canvas.getByRole("switch", { name: "Trust configured proxies" }));
		await userEvent.click(canvas.getByRole("button", { name: "Save trusted proxies" }));
		await expect(await dialog.findByText(/Trust these proxy addresses/)).toBeInTheDocument();
		await userEvent.click(dialog.getByRole("button", { name: "Confirm" }));
		await waitFor(() => expect(mocked(updateSetting)).toHaveBeenCalledWith("trusted_proxies", { enabled: true, addresses: ["192.0.2.0/24"] }));
		await userEvent.click(canvas.getByRole("switch", { name: "Trust configured proxies" }));
		await userEvent.click(canvas.getByRole("button", { name: "Save trusted proxies" }));
		await waitFor(() => expect(mocked(updateSetting)).toHaveBeenCalledWith("trusted_proxies", { enabled: false, addresses: ["192.0.2.0/24"] }));
	},
};

export const SecurityInvalidInput: Story = {
	play: async ({ canvas }) => {
		const limit = await canvas.findByLabelText("Attempts per IP");
		await userEvent.clear(limit);
		await userEvent.type(limit, "0");
		await expect(canvas.getByText("Enter whole numbers within the allowed ranges.")).toBeVisible();
		await expect(canvas.getByRole("button", { name: "Save login protection" })).toBeDisabled();
	},
};

export const SecurityConfiguration: Story = {
	beforeEach: () => {
		mocked(updateSetting).mockImplementation(async (key, value) => ({ key, value, isPublic: false, updatedAt: "2026-10-01T10:00:00.000Z" }));
	},
	play: async ({ canvas }) => {
		for (const [label, value] of [
			["Minimum response time (ms)", "600"],
			["Maximum random jitter (ms)", "50"],
			["Attempts per IP", "15"],
			["Attempts per username", "8"],
			["Window (seconds)", "120"],
		]) {
			const input = await canvas.findByLabelText(label);
			await userEvent.clear(input);
			await userEvent.type(input, value);
		}
		await userEvent.click(canvas.getByRole("button", { name: "Save login protection" }));
		await waitFor(() =>
			expect(mocked(updateSetting)).toHaveBeenCalledWith("login_security", {
				timingEnabled: true,
				minimumMs: 600,
				jitterMs: 50,
				throttleEnabled: true,
				ipLimit: 15,
				usernameLimit: 8,
				windowSeconds: 120,
			}),
		);
		await userEvent.click(canvas.getByRole("switch", { name: "Trust configured proxies" }));
		await expect(canvas.getByText("Enter at least one trusted address before enabling proxy trust.")).toBeVisible();
		await expect(canvas.getByRole("button", { name: "Save trusted proxies" })).toBeDisabled();
	},
};

export const ShiftClickSelection: Story = {
	beforeEach: () => {
		mocked(listAdminUsers).mockResolvedValue([{ ...adminUsers[1], email: null }, adminUsers[2], adminUsers[0], { ...adminUsers[1], id: "u4", username: "dana", displayName: "Dana", email: null }, { ...adminUsers[1], id: "u5", username: "erin", displayName: "Erin", email: null }]);
	},
	play: async ({ canvas }) => {
		const user = userEvent.setup();
		await user.click(await canvas.findByRole("checkbox", { name: "Select bob" }));
		await user.keyboard("{Shift>}");
		await user.click(canvas.getByRole("checkbox", { name: "Select erin" }));
		await user.keyboard("{/Shift}");
		await expect(canvas.getByRole("checkbox", { name: "Select carol" })).toBeChecked();
		await expect(canvas.getByRole("checkbox", { name: "Select dana" })).toBeChecked();
		await expect(canvas.getByRole("checkbox", { name: "Select alice" })).toBeDisabled();
		await expect(canvas.getByText("4 selected")).toBeVisible();

		await user.keyboard("{Shift>}");
		await user.click(canvas.getByRole("checkbox", { name: "Select bob" }));
		await user.keyboard("{/Shift}");
		for (const name of ["bob", "carol", "dana", "erin"]) {
			await expect(canvas.getByRole("checkbox", { name: `Select ${name}` })).not.toBeChecked();
		}

		await user.click(canvas.getByRole("checkbox", { name: "Select bob" }));
		await user.type(canvas.getByRole("searchbox"), "a");
		await user.keyboard("{Shift>}");
		await user.click(canvas.getByRole("checkbox", { name: "Select dana" }));
		await user.keyboard("{/Shift}");
		await expect(canvas.getByRole("checkbox", { name: "Select carol" })).not.toBeChecked();
		await expect(canvas.getByText("2 selected")).toBeVisible();
		await user.clear(canvas.getByRole("searchbox"));
		await user.click(canvas.getByRole("button", { name: "Clear selection" }));
		await user.keyboard("{Shift>}");
		await user.click(canvas.getByRole("checkbox", { name: "Select erin" }));
		await user.keyboard("{/Shift}");
		await expect(canvas.getByText("1 selected")).toBeVisible();
		await expect(canvas.getByRole("checkbox", { name: "Select dana" })).not.toBeChecked();
	},
};

export const BulkSelection: Story = {
	play: async ({ canvas }) => {
		const ownAccount = await canvas.findByRole("checkbox", { name: "Select alice" });
		await expect(ownAccount).toBeDisabled();
		await userEvent.click(canvas.getByRole("checkbox", { name: "Select bob" }));
		await userEvent.type(canvas.getByRole("searchbox"), "carol");
		await userEvent.click(canvas.getByRole("checkbox", { name: "Select all visible users" }));
		await expect(canvas.getByText("2 selected")).toBeVisible();
		await userEvent.selectOptions(canvas.getByRole("combobox", { name: "Bulk action" }), "disable");
		await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
		const dialog = within(document.body);
		await expect(await dialog.findByText("Apply Disable accounts to 2 user(s): bob, carol?")).toBeInTheDocument();
		await userEvent.click(dialog.getByRole("button", { name: "Cancel" }));
		await expect(mocked(updateAdminUser)).not.toHaveBeenCalled();
	},
};

export const BulkPartialFailure: Story = {
	beforeEach: () => {
		mocked(updateAdminUser).mockResolvedValueOnce(adminUsers[1]).mockRejectedValueOnce(new Error("Access denied"));
	},
	play: async ({ canvas }) => {
		await userEvent.click(await canvas.findByRole("checkbox", { name: "Select all visible users" }));
		await userEvent.selectOptions(canvas.getByRole("combobox", { name: "Bulk action" }), "disable");
		await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
		await userEvent.click(await within(document.body).findByRole("button", { name: "Confirm" }));
		await expect(await canvas.findByText("carol: Access denied")).toBeVisible();
		await expect(canvas.getByText("1 selected")).toBeVisible();
		await expect(canvas.getByRole("checkbox", { name: "Select carol" })).toBeChecked();
		await expect(mocked(updateAdminUser)).toHaveBeenCalledWith("u2", { disabled: true });
		await expect(mocked(updateAdminUser)).toHaveBeenCalledWith("u3", { disabled: true });
		await expect(mocked(updateAdminUser)).toHaveBeenCalledTimes(2);
	},
};

export const BulkDelete: Story = {
	beforeEach: () => void mocked(deleteAdminUser).mockResolvedValue(undefined),
	play: async ({ canvas }) => {
		await userEvent.click(await canvas.findByRole("checkbox", { name: "Select all visible users" }));
		await userEvent.selectOptions(canvas.getByRole("combobox", { name: "Bulk action" }), "delete");
		await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
		await expect(await within(document.body).findByText("Apply Delete accounts permanently to 2 user(s): bob, carol?")).toBeInTheDocument();
		await expect(mocked(deleteAdminUser)).not.toHaveBeenCalled();
		await userEvent.click(await within(document.body).findByRole("button", { name: "Confirm" }));
		await waitFor(() => expect(mocked(deleteAdminUser)).toHaveBeenCalledTimes(2));
		await expect(mocked(deleteAdminUser)).toHaveBeenCalledWith("u2");
		await expect(mocked(deleteAdminUser)).toHaveBeenCalledWith("u3");
		await expect(mocked(deleteAdminUser)).toHaveBeenCalledTimes(2);
	},
};
