import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, mocked, userEvent, waitFor, within } from "storybook/test";
import { createGuideSource, getAdminGuide, type AdminGuideData } from "../../api/guide";
import GuidePanel from "./GuidePanel.vue";

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();

const guide: AdminGuideData = {
	sources: [
		{ id: "s1", kind: "epg", name: "XMLTV Netherlands", url: "https://example.com/epg/nl.xml.gz", enabled: true, isDefault: true, sortOrder: 0, channelCount: 42, programmeCount: 18_400, lastRefreshedAt: hoursAgo(3), lastError: null },
		{ id: "s2", kind: "iptv", name: "Public IPTV", url: "https://example.com/iptv/nl.m3u", enabled: true, isDefault: false, sortOrder: 1, channelCount: 120, programmeCount: 0, lastRefreshedAt: hoursAgo(30), lastError: "HTTP 503 from upstream" },
	],
	settings: { regionalMergeThresholdPercent: 65 },
	channels: [
		{ id: "c1", sourceId: "s1", sourceName: "XMLTV Netherlands", name: "NPO 1", icon: null, enabled: true, sortOrder: 0, iptvChannelId: "i1", automaticIptvChannelId: "i1" },
		{ id: "c2", sourceId: "s1", sourceName: "XMLTV Netherlands", name: "NPO 2", icon: null, enabled: true, sortOrder: 1, iptvChannelId: null, automaticIptvChannelId: null },
		{ id: "c3", sourceId: "s1", sourceName: "XMLTV Netherlands", name: "RTL 4", icon: null, enabled: false, sortOrder: 2, iptvChannelId: null, automaticIptvChannelId: null },
	],
	iptvChannels: [
		{ id: "i1", sourceId: "s2", sourceName: "Public IPTV", name: "NPO 1 HD", icon: null, group: "National", playable: true, sortOrder: 0 },
		{ id: "i2", sourceId: "s2", sourceName: "Public IPTV", name: "NPO 2 HD", icon: null, group: "National", playable: true, sortOrder: 1 },
	],
};

const meta = {
	title: "Admin/GuidePanel",
	component: GuidePanel,
	tags: ["autodocs"],
	render: () => ({ components: { GuidePanel }, template: '<div class="max-w-5xl"><GuidePanel /></div>' }),
} satisfies Meta<typeof GuidePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { beforeEach: () => void mocked(getAdminGuide).mockResolvedValue(guide) };
export const AddIptvSource: Story = {
	beforeEach: () => {
		mocked(getAdminGuide).mockResolvedValue(guide);
		mocked(createGuideSource).mockResolvedValue(guide.sources[1]!);
	},
	play: async ({ canvasElement }) => {
		const page = within(canvasElement.ownerDocument.body);
		const kind = await page.findByRole("combobox", { name: /source type/i });
		await userEvent.click(kind);
		await userEvent.click(await page.findByRole("option", { name: "IPTV" }));
		const form = kind.closest("form");
		if (!form) throw new Error("Missing guide source form");
		const inputs = within(form).getAllByRole("textbox");
		await userEvent.type(inputs[0]!, "Regional IPTV");
		await userEvent.type(inputs[1]!, "https://example.com/regional.m3u");
		await userEvent.click(within(form).getByRole("button", { name: "Add source" }));
		await waitFor(() => expect(mocked(createGuideSource)).toHaveBeenCalledWith({
			kind: "iptv", name: "Regional IPTV", url: "https://example.com/regional.m3u",
		}));
	},
};
export const NoSources: Story = { beforeEach: () => void mocked(getAdminGuide).mockResolvedValue({ ...guide, sources: [], channels: [], iptvChannels: [] }) };
export const Loading: Story = { beforeEach: () => void mocked(getAdminGuide).mockReturnValue(new Promise(() => undefined)) };
export const LoadError: Story = { beforeEach: () => void mocked(getAdminGuide).mockRejectedValue(new Error("Network error")) };
