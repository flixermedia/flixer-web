import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { fn } from "storybook/test";
import LoginForm from "./LoginForm.vue";

const meta = {
	title: "Auth/LoginForm",
	component: LoginForm,
	tags: ["autodocs"],
	args: {
		isSubmitting: false,
		sessionCheckUnavailable: false,
		registrationEnabled: true,
		registrationStatusError: "",
		onSubmit: fn(),
		onSwitchMode: fn(),
		onPasskey: fn(),
		onBiometric: fn(),
		onForgetBiometric: fn(),
		onResend: fn(),
	},
} satisfies Meta<typeof LoginForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Submitting: Story = { args: { isSubmitting: true, initialUsername: "alex" } };
export const RegistrationDisabled: Story = { args: { registrationEnabled: false } };
export const Biometric: Story = { args: { biometricAvailable: true, biometricLoginAvailable: true, initialUsername: "alex" } };
export const ConfirmEmailPending: Story = { args: { canResend: true, registrationStatusError: "Registration status could not be loaded." } };
export const SessionCheckUnavailable: Story = { args: { sessionCheckUnavailable: true } };
