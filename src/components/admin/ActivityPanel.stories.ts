import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
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
