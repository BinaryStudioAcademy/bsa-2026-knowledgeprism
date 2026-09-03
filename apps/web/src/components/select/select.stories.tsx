import type { Meta, StoryObj } from "@storybook/react";

import { useState } from "react";

import { Select, type SelectOption } from "./select.js";

const options: SelectOption[] = [
	{ label: "Option 1", value: "1" },
	{ label: "Option 2", value: "2" },
	{ label: "Option 3", value: "3" },
];

const SelectWrapper = ({
	error,
	isDisabled = false,
	label = "Select an option",
	placeholder = "Choose...",
}: {
	error?: string;
	isDisabled?: boolean;
	label?: string;
	placeholder?: string;
}): React.JSX.Element => {
	const [value, setValue] = useState("");

	return (
		<Select
			{...(error && { error })}
			isDisabled={isDisabled}
			label={label}
			onChange={setValue}
			options={options}
			placeholder={placeholder}
			value={value}
		/>
	);
};

const meta = {
	component: SelectWrapper,
	title: "Components/Form/Select",
} satisfies Meta<typeof SelectWrapper>;

type Story = StoryObj<typeof meta>;

const Default: Story = {
	args: {
		isDisabled: false,
		label: "Role",
		placeholder: "Select your role",
	},
};

const Disabled: Story = {
	args: {
		isDisabled: true,
		label: "Role",
		placeholder: "Select your role",
	},
};

const WithError: Story = {
	args: {
		error: "This field is required",
		label: "Role",
		placeholder: "Select your role",
	},
};

export default meta;
export { Default, Disabled, WithError };
