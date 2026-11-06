import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { fetchHomeImage, fetchMediaImage } from "../../api";
import { artworkBlob } from "../../storybook/fixturesAccount";
import AuthImage from "./AuthImage.vue";

const meta = {
	title: "UI/AuthImage",
	component: AuthImage,
	tags: ["autodocs"],
	args: { itemId: "item-1", index: 0, alt: "Poster", scope: "admin", width: 200 },
	argTypes: { scope: { control: "inline-radio", options: ["admin", "library"] }, width: { control: { type: "number", min: 40, max: 400, step: 20 } } },
	decorators: [() => ({ template: '<div class="h-72 w-48 overflow-hidden rounded-lg"><story /></div>' })],
	beforeEach: () => {
		mocked(fetchMediaImage).mockImplementation(async () => artworkBlob());
		mocked(fetchHomeImage).mockImplementation(async () => artworkBlob("#0e7490"));
	},
} satisfies Meta<typeof AuthImage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Admin: Story = {};
export const Library: Story = { args: { itemId: "item-2", scope: "library" } };
export const Failed: Story = {
	args: { itemId: "item-3" },
	beforeEach: () => {
		mocked(fetchMediaImage).mockRejectedValue(new Error("Not found"));
	},
};
