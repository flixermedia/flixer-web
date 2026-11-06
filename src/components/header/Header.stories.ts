import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { fn, mocked } from "storybook/test";
import { getAccessMe, getProfile, getRequestsConfig } from "../../api";
import { useProfile } from "../../composables/useProfile";
import { useRequestsConfig } from "../../composables/useRequestsConfig";
import { accessFixture, adminFixture, userFixture } from "../../storybook/fixturesSession";
import { withNamedRoutes } from "../../storybook/routeDecorator";
import Header from "./Header.vue";

const links = [
	{ label: "Home", to: "/" },
	{ label: "Movies", to: "/movies" },
	{ label: "TV", to: "/tv" },
	{ label: "Music", to: "/music" },
	{ label: "Guide", to: "/guide" },
];

const meta = {
	title: "Header/Header",
	component: Header,
	tags: ["autodocs"],
	parameters: { layout: "fullscreen" },
	args: { links, isSigningOut: false, onLogout: fn() },
	// The header is fixed to the viewport; a transformed wrapper keeps it inside the story frame.
	decorators: [withNamedRoutes({ search: "/search", profile: "/u/:username" }), () => ({ template: '<div class="relative h-[26rem] overflow-hidden" style="transform: translateZ(0)"><story /></div>' })],
	beforeEach: () => {
		useProfile().profile.value = userFixture;
		useRequestsConfig().config.value = null;
		mocked(getProfile).mockResolvedValue(userFixture);
		mocked(getAccessMe).mockResolvedValue(accessFixture);
		mocked(getRequestsConfig).mockResolvedValue({ enabled: false } as never);
	},
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Admin: Story = {
	beforeEach: () => {
		useProfile().profile.value = adminFixture;
		mocked(getProfile).mockResolvedValue(adminFixture);
	},
};
export const Docked: Story = { args: { docked: true } };
export const NavAtStart: Story = { args: { navPosition: "start", navBackground: false } };
export const SigningOut: Story = { args: { isSigningOut: true } };
export const NoLinks: Story = { args: { links: [] } };
