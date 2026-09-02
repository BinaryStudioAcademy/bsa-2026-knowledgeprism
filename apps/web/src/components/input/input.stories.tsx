import type { Meta, StoryObj } from "@storybook/react";

import { useForm } from "react-hook-form";

import { Input } from "./input.js";

type FormValues = {
	email: string;
};

const InputWrapper = ({
	label = "Email Address",
	placeholder = "Enter your email",
	type = "text",
}: {
	label?: string;
	placeholder?: string;
	type?: "email" | "text";
}): React.JSX.Element => {
	const {
		control,
		formState: { errors },
	} = useForm<FormValues>({
		defaultValues: {
			email: "",
		},
	});

	return (
		<Input
			control={control}
			errors={errors}
			label={label}
			name="email"
			placeholder={placeholder}
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

export default meta;
export { Default, Email };
