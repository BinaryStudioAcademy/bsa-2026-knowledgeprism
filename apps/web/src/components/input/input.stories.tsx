import type { Meta, StoryObj } from "@storybook/react";

import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Input } from "./input.js";

type FormValues = {
	email: string;
};

const InputWrapper = ({
	disabled = false,
	hasError = false,
	hintInfo,
	isToggleablePassword,
	label = "Email Address",
	maxLength,
	placeholder = "Enter your email",
	transformValue,
	type = "text",
}: {
	disabled?: boolean;
	hasError?: boolean;
	hintInfo?: string;
	isToggleablePassword?: boolean;
	label?: string;
	maxLength?: number;
	placeholder?: string;
	transformValue?: (value: string) => string;
	type?: "email" | "password" | "text";
}): React.JSX.Element => {
	const { control, setError } = useForm<FormValues>({
		defaultValues: {
			email: "",
		},
	});

	useEffect(() => {
		if (hasError) {
			setError("email", {
				message: "Please enter a valid value.",
				type: "manual",
			});
		}
	}, [hasError, setError]);

	return (
		<Input
			control={control}
			disabled={disabled}
			hintInfo={hintInfo}
			isToggleablePassword={isToggleablePassword}
			label={label}
			maxLength={maxLength}
			name="email"
			placeholder={placeholder}
			transformValue={transformValue}
			type={type}
		/>
	);
};

const meta = {
	component: InputWrapper,
	title: "Components/Form/Input",
} satisfies Meta<typeof InputWrapper>;

type Story = StoryObj<typeof meta>;

const Default: Story = {
	args: {
		label: "Username",
		placeholder: "Enter username",
		type: "text",
	},
};

const Email: Story = {
	args: {
		label: "Email",
		placeholder: "name@example.com",
		type: "email",
	},
};

const Password: Story = {
	args: {
		label: "Password",
		placeholder: "Enter your password",
		type: "password",
	},
};

const PasswordWithToggle: Story = {
	args: {
		hintInfo: "Password must be at least 8 characters long",
		isToggleablePassword: true,
		label: "Password",
		maxLength: 32,
		placeholder: "Enter your password",
		type: "password",
	},
};

const Disabled: Story = {
	args: {
		disabled: true,
		label: "Disabled Input",
		placeholder: "This input is disabled",
		type: "text",
	},
};

const WithError: Story = {
	args: {
		hasError: true,
		label: "Username",
		placeholder: "Enter username",
		type: "text",
	},
};

export default meta;
export { Default, Disabled, Email, Password, PasswordWithToggle, WithError };
