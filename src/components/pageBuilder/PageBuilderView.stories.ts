import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { createAgent } from "@ui-sdk/vue/agent";
import { expect, fn, userEvent, waitFor } from "storybook/test";
import { api } from "../../api/client";
import PageBuilderView from "./PageBuilderView.vue";
import type { BuilderPage } from "./pageBuilder";

const write = fn();

const meta = {
	title: "Page Builder/Editor",
	component: PageBuilderView,
	parameters: { layout: "fullscreen" },
	beforeEach: () => {
		const previousAdapter = api.defaults.adapter;
		const page: BuilderPage = {
			id: "story-page",
			title: "Draft page",
			slug: "draft-page",
			kind: "page",
			access: "public",
			draft: {
				blocks: [
					{ id: "text", type: "text", text: "Sample text", image: null },
					{ id: "heading", type: "heading", text: "Sample heading", image: null },
				],
			},
			published: { title: "Draft page", slug: "draft-page", blocks: [] },
		};
		const reads = new Map<string, unknown>([
			["/admin/pages", [page]],
			["/admin/page-site", { homePageId: null, navigationIds: [] }],
			["/admin/page-templates", []],
		]);
		write.mockClear();
		api.defaults.adapter = async (config) => {
			const path = config.url ?? "";
			let data: unknown;
			if (config.method === "get" && reads.has(path)) {
				data = reads.get(path);
			} else if (config.method === "put" && path === "/admin/pages/story-page") {
				const draft = JSON.parse(config.data);
				write(draft);
				data = { ...page, ...draft };
			} else {
				throw new Error(`Unexpected story request: ${config.method} ${path}`);
			}
			return { data, status: 200, statusText: "OK", headers: {}, config };
		};
		return () => { api.defaults.adapter = previousAdapter; };
	},
} satisfies Meta<typeof PageBuilderView>;
export default meta;

export const Editing: StoryObj<typeof meta> = {
	play: async ({ canvas }) => {
		const title = await canvas.findByRole<HTMLInputElement>("textbox", { name: "Page title" });
		const editor = canvas.getByRole<HTMLTextAreaElement>("textbox", { name: /^Text$/ });
		await userEvent.clear(title);
		await userEvent.type(title, "Weekend plans");
		await expect(title).toHaveValue("Weekend plans");
		await userEvent.click(editor);
		editor.setSelectionRange(0, 6);
		await userEvent.click(canvas.getByRole("button", { name: "Bold" }));
		await expect(editor).toHaveValue("**Sample** text");
		await expect(editor).toHaveFocus();
		await expect([editor.selectionStart, editor.selectionEnd]).toEqual([2, 8]);

		const moveDown = canvas.getAllByRole("button", { name: "Move down" });
		await expect(moveDown[1]).toBeDisabled();
		moveDown[0]!.focus();
		await userEvent.keyboard(" ");

		const agent = createAgent();
		const labels = agent.snapshot().filter((entry) => !entry.offPage).map((entry) => entry.label);
		await expect(labels.sort()).toEqual(["Desktop preview", "Mobile preview"]);
		await expect((await agent.act({ steps: [{ ref: "Save draft", action: "press" }] })).ok).toBe(false);
		await expect(write).not.toHaveBeenCalled();
		await expect((await agent.act({ steps: [{ ref: "Mobile preview", action: "press" }] })).ok).toBe(true);
		await expect(canvas.getByRole("button", { name: "Mobile preview" })).toHaveAttribute("aria-pressed", "true");

		await userEvent.click(canvas.getByRole("button", { name: "Save draft" }));
		await waitFor(() => expect(write).toHaveBeenCalledWith(expect.objectContaining({
			title: "Weekend plans",
			draft: expect.objectContaining({
				blocks: [expect.objectContaining({ id: "heading" }), expect.objectContaining({ id: "text", text: "**Sample** text" })],
			}),
		})));
	},
};
