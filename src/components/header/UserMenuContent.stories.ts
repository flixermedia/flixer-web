import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { fn, mocked } from "storybook/test";
import { getAccessMe, getRequestsConfig, type AccessMe, type UserProfile } from "../../api";
import { useAccess } from "../../composables/useAccess";
import { useProfile } from "../../composables/useProfile";
import { useRequestsConfig } from "../../composables/useRequestsConfig";
import { accessFixture, adminFixture, userFixture } from "../../storybook/fixturesSession";
import { withNamedRoutes } from "../../storybook/routeDecorator";
import UserMenuContent from "./UserMenuContent.vue";

function menuStory(options: { profile: UserProfile | null; requests?: boolean; access?: AccessMe }) {
	return (args: { isSigningOut: boolean; onClose?: () => void; onLogout?: () => void }) => ({
		components: { UserMenuContent },
		setup() {
			useProfile().profile.value = options.profile;
			useRequestsConfig().config.value = options.requests ? ({ enabled: true } as never) : null;
			const access = options.access ?? accessFixture;
			useAccess().me.value = access;
			mocked(getAccessMe).mockResolvedValue(access);
			mocked(getRequestsConfig).mockResolvedValue({ enabled: options.requests === true } as never);
			return { args };
		},
		template: '<div class="w-64 rounded border border-white/10 bg-flixer-surface/95 p-1.5"><UserMenuContent v-bind="args" /></div>',
	});
}

const meta = {
	title: "Header/UserMenuContent",
	component: UserMenuContent,
	tags: ["autodocs"],
	args: { isSigningOut: false, onClose: fn(), onLogout: fn() },
	decorators: [withNamedRoutes({ profile: "/u/:username" })],
} satisfies Meta<typeof UserMenuContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const User: Story = { render: menuStory({ profile: userFixture }) };
export const Admin: Story = { render: menuStory({ profile: adminFixture, requests: true }) };
export const SigningOut: Story = { args: { isSigningOut: true }, render: menuStory({ profile: userFixture }) };
export const WithViewingLimits: Story = { render: menuStory({ profile: userFixture, access: { ...accessFixture, enforced: true, hasPin: true } }) };
export const SignedOut: Story = { render: menuStory({ profile: null }) };
