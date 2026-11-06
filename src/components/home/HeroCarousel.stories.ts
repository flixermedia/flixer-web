import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mocked } from "storybook/test";
import { fetchHomeImage, fetchMediaImage } from "../../api";
import { artworkBlob } from "../../storybook/fixturesAccount";
import { withNamedRoutes } from "../../storybook/routeDecorator";
import { featuredFixtures } from "../../storybook/fixturesPlayer";
import HeroCarousel from "./HeroCarousel.vue";

const meta = {
	title: "Home/HeroCarousel",
	component: HeroCarousel,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	args: { items: featuredFixtures },
	decorators: [withNamedRoutes({ "media-item": "/media/:id" })],
	beforeEach: () => {
		mocked(fetchMediaImage).mockImplementation(async () => artworkBlob("#0e7490"));
		mocked(fetchHomeImage).mockImplementation(async () => artworkBlob("#0e7490"));
	},
} satisfies Meta<typeof HeroCarousel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const SingleItem: Story = { args: { items: featuredFixtures.slice(0, 1) } };
export const LongTitleWithoutBackdrop: Story = { args: { items: featuredFixtures.slice(2) } };
export const Empty: Story = { args: { items: [] } };
