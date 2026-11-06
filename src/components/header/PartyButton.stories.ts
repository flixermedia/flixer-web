import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { useParty } from "../../composables/useParty";
import { useProfile } from "../../composables/useProfile";
import { partyFixture, userFixture } from "../../storybook/fixturesSession";
import PartyButton from "./PartyButton.vue";

const buttonClass = "relative grid size-10 place-items-center rounded text-white/80 transition hover:bg-white/10 hover:text-white";

function partyStory(status: "live" | "reconnecting", kind: "video" | "music" = "video") {
	return (args: { buttonClass: string }) => ({
		components: { PartyButton },
		setup() {
			const party = useParty();
			party.party.value = { ...partyFixture, kind };
			party.status.value = status;
			useProfile().profile.value = userFixture;
			return { args };
		},
		template: '<div class="flex h-72 justify-end"><PartyButton v-bind="args" /></div>',
	});
}

const meta = {
	title: "Header/PartyButton",
	component: PartyButton,
	tags: ["autodocs"],
	args: { buttonClass },
} satisfies Meta<typeof PartyButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Watching: Story = { render: partyStory("live") };
export const Listening: Story = { render: partyStory("live", "music") };
export const Reconnecting: Story = { render: partyStory("reconnecting") };
