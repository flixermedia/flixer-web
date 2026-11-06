import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { ref } from "vue";
import { searchPaymentScopes, type ContentScope } from "../../../api";
import ScopePicker from "./ScopePicker.vue";

const meta = {
	title: "Admin/Payments/ScopePicker",
	component: ScopePicker,
	tags: ["autodocs"],
	args: { label: "Unlocks", modelValue: [] },
	beforeEach: () => {
		mocked(searchPaymentScopes).mockResolvedValue({
			items: [
				{ id: "item-1", title: "Night of the Comet", type: "movie", year: 1984, seasonNumber: null, episodeNumber: null },
				{ id: "item-2", title: "Night Court", type: "series", year: 1984, seasonNumber: null, episodeNumber: null },
			],
			artists: ["Nightwish"],
		});
	},
	render: (args) => ({ components: { ScopePicker }, setup: () => ({ args, scopes: ref<ContentScope[]>([{ type: "all", ref: null }]) }), template: '<ScopePicker v-bind="args" v-model="scopes" class="w-[28rem]" />' }),
} satisfies Meta<typeof ScopePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {};
export const Multiple: Story = {
	args: { multiple: true, modelValue: [] },
	render: (args) => ({
		components: { ScopePicker },
		setup: () => ({
			args,
			scopes: ref<ContentScope[]>([
				{ type: "kind", ref: "movies" },
				{ type: "item", ref: "item-1", label: "Night of the Comet (1984)" },
			]),
		}),
		template: '<ScopePicker v-bind="args" v-model="scopes" class="w-[28rem]" />',
	}),
};
