import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { fn } from "storybook/test";
import MonacoEditor from "./MonacoEditor.vue";

const meta = {
	title: "Admin/MonacoEditor",
	component: MonacoEditor,
	tags: ["autodocs"],
	parameters: { layout: "padded" },
	args: { modelValue: "<h1>Hello {{displayName}}</h1>\n<p>Thanks for joining Flixer.</p>", label: "HTML editor", language: "html", "onUpdate:modelValue": fn() },
	argTypes: { language: { control: "inline-radio", options: ["html", "plaintext"] }, height: { control: "text" } },
	render: (args) => ({ components: { MonacoEditor }, setup: () => ({ args }), template: '<div class="w-[40rem]"><MonacoEditor v-bind="args" /></div>' }),
} satisfies Meta<typeof MonacoEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Html: Story = {};
export const PlainText: Story = { args: { language: "plaintext", modelValue: "Hello {{displayName}},\n\nThanks for joining Flixer.", label: "Text editor" } };
export const Short: Story = { args: { height: "8rem" } };
