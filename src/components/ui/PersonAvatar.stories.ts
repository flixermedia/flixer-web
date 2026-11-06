import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { fetchHomeImage, fetchMediaImage, fetchPersonImage } from "../../api";
import { artworkBlob } from "../../storybook/fixturesAccount";
import PersonAvatar from "./PersonAvatar.vue";

const meta = {
	title: "UI/PersonAvatar",
	component: PersonAvatar,
	tags: ["autodocs"],
	args: { personId: "person-1", name: "Ada Lovelace", hasImage: true, width: 96 },
	beforeEach: () => {
		mocked(fetchPersonImage).mockImplementation(async () => artworkBlob("#be185d"));
		mocked(fetchMediaImage).mockImplementation(async () => artworkBlob());
		mocked(fetchHomeImage).mockImplementation(async () => artworkBlob());
	},
} satisfies Meta<typeof PersonAvatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithPhoto: Story = {};
export const Initials: Story = { args: { hasImage: false } };
export const ArtworkFallback: Story = { args: { hasImage: false, fallback: { itemId: "album-1", index: 0 } } };
