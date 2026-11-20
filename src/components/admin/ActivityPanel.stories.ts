import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, mocked, userEvent, waitFor, within } from "storybook/test";
import { onBeforeUnmount, ref } from "vue";
import { useRouter } from "vue-router";
import { getAdminActivity, type AdminActivityPage } from "../../api";
import { adminOverview } from "../../storybook/fixturesAdmin";
import ActivityPanel from "./ActivityPanel.vue";

const page: AdminActivityPage = {
	items: [...adminOverview.activity, { user: "dave", title: "Track 04", type: "track", showTitle: null, seasonNumber: null, episodeNumber: null, positionSeconds: 120, durationSeconds: 240, completed: false, at: new Date(Date.now() - 86_400_000).toISOString() }],
	page: 1,
	pageSize: 25,
	total: 4,
	summary: { total: 4, finished: 1, inProgress: 3, users: 4 },
	users: [
		{ id: "user-1", name: "alice" },
		{ id: "user-2", name: "bob" },
		{ id: "user-3", name: "carol" },
		{ id: "user-4", name: "dave" },
	],
};

const meta = {
	title: "Admin/ActivityPanel",
	component: ActivityPanel,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
	// The panel only loads while the router is on its `admin-activity` route.
	decorators: [
		(story) => ({
			components: { story },
			setup() {
				const router = useRouter();
				const ready = ref(false);
				const removeRoute = router.addRoute({ name: "admin-activity", path: "/admin/activity", component: { render: () => null } });
				void router.push("/admin/activity").then(() => (ready.value = true));
				onBeforeUnmount(() => removeRoute());
				return { ready };
			},
			template: '<div class="w-[1100px]"><story v-if="ready" /></div>',
		}),
	],
	beforeEach: () => {
		mocked(getAdminActivity).mockResolvedValue(page);
	},
} satisfies Meta<typeof ActivityPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const FilterControls: Story = {
	play: async ({ canvas, canvasElement }) => {
		const page = within(canvasElement.ownerDocument.body);
		const selectOption = async (label: string, option: string) => {
			await userEvent.click(await canvas.findByRole("combobox", { name: label }));
			await userEvent.click(await page.findByRole("option", { name: option }));
		};

		await selectOption("User", "alice");
		await waitFor(() => expect(mocked(getAdminActivity)).toHaveBeenLastCalledWith(expect.objectContaining({ user: "user-1" })));
		await selectOption("Type", "Movie");
		await waitFor(() => expect(mocked(getAdminActivity)).toHaveBeenLastCalledWith(expect.objectContaining({ user: "user-1", type: "movie" })));
		await selectOption("Status", "In Progress");
		await waitFor(() => expect(mocked(getAdminActivity)).toHaveBeenLastCalledWith(expect.objectContaining({ status: "in_progress" })));
		await selectOption("Sort", "Oldest First");
		await waitFor(() => expect(mocked(getAdminActivity)).toHaveBeenLastCalledWith(expect.objectContaining({ sort: "oldest" })));

		await userEvent.click(canvas.getByRole("button", { name: "Clear Filters" }));
		await waitFor(() => expect(mocked(getAdminActivity)).toHaveBeenLastCalledWith(expect.objectContaining({ user: "", type: "", status: "", sort: "recent" })));
	},
};
export const DateFilters: Story = {
	play: async ({ canvas }) => {
		const from = (await canvas.findByRole("textbox", { name: "From" })) as HTMLInputElement;
		const to = canvas.getByRole("textbox", { name: "To" }) as HTMLInputElement;
		const now = new Date();
		const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

		await userEvent.type(from, `${firstOfMonth}{Enter}`);
		await waitFor(() => expect(mocked(getAdminActivity)).toHaveBeenLastCalledWith(expect.objectContaining({ from: firstOfMonth })));

		await userEvent.click(canvas.getByRole("button", { name: "To calendar" }));
		const toCalendar = await canvas.findByRole("grid");
		expect(canvas.getByRole("button", { name: /previous month/i })).toHaveAttribute("data-disabled");
		const earliestDate = toCalendar.querySelector(`[data-value="${firstOfMonth}"]`);
		expect(earliestDate).not.toHaveAttribute("data-disabled");
		(earliestDate as HTMLElement).focus();
		await userEvent.keyboard("{ArrowRight}{ArrowLeft}{Enter}");
		await waitFor(() => expect(mocked(getAdminActivity)).toHaveBeenLastCalledWith(expect.objectContaining({ from: firstOfMonth, to: firstOfMonth })));

		await userEvent.click(canvas.getByRole("button", { name: "From calendar" }));
		await canvas.findByRole("grid");
		expect(canvas.getByRole("button", { name: /next month/i })).toHaveAttribute("data-disabled");

		await userEvent.clear(to);
		await userEvent.keyboard("{Enter}");
		await waitFor(() => expect(mocked(getAdminActivity)).toHaveBeenLastCalledWith(expect.objectContaining({ from: firstOfMonth, to: "" })));
		expect(to.value).toBe("");
		await userEvent.click(canvas.getByRole("button", { name: "Clear Filters" }));
		await waitFor(() => expect(from.value).toBe(""));
		expect(to.value).toBe("");
	},
};
export const Empty: Story = {
	beforeEach: () => {
		mocked(getAdminActivity).mockResolvedValue({ ...page, items: [], total: 0, summary: { total: 0, finished: 0, inProgress: 0, users: 0 } });
	},
};
export const LoadError: Story = {
	beforeEach: () => {
		mocked(getAdminActivity).mockRejectedValue(new Error("Network error"));
	},
};
