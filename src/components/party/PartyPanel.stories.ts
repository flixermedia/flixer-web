import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { fn } from "storybook/test";
import { useParty } from "../../composables/useParty";
import { useProfile } from "../../composables/useProfile";
import { usePartyVoice } from "../../composables/usePartyVoice";
import { adminFixture, partyFixture, userFixture } from "../../storybook/fixturesSession";
import PartyPanel from "./PartyPanel.vue";

function panelStory(options: { host: boolean; voice?: boolean }) {
	return (args: { onLeft?: () => void }) => ({
		components: { PartyPanel },
		setup() {
			useParty().party.value = partyFixture;
			useProfile().profile.value = options.host ? adminFixture : userFixture;
			usePartyVoice().available.value = options.voice ?? false;
			return { args };
		},
		template: '<div class="theme-dark w-64 rounded border border-flixer-border bg-flixer-surface p-2 text-flixer-text"><PartyPanel v-bind="args" /></div>',
	});
}

const meta = {
	title: "Party/PartyPanel",
	component: PartyPanel,
	tags: ["autodocs"],
	args: { onLeft: fn() },
} satisfies Meta<typeof PartyPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Guest: Story = { render: panelStory({ host: false }) };
export const Host: Story = { render: panelStory({ host: true }) };
export const WithVoice: Story = { render: panelStory({ host: false, voice: true }) };
