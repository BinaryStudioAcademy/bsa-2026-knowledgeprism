import type { Meta, StoryObj } from "@storybook/react";

import { useForm } from "react-hook-form";

import { Checkbox } from "./checkbox.js";

type FormValues = {
	agreement: boolean;
};

const CheckboxWrapper = ({
	disabled = false,
	label = "Accept terms and conditions",
}: {
	disabled?: boolean;
	label?: string;
}): React.JSX.Element => {
	const { control } = useForm<FormValues>({
		defaultValues: {
			agreement: false,
		},
	});

	return (
		<Checkbox
			control={control}
			disabled={disabled}
			label={label}
			name="agreement"
		/>
	);
};

const meta = {
	component: CheckboxWrapper,
	title: "Components/Form/Checkbox",
} satisfies Meta<typeof CheckboxWrapper>;

type Story = StoryObj<typeof meta>;

const Default: Story = {
	args: {
		disabled: false,
		label: "Remember me",
	},
};

const Disabled: Story = {
	args: {
		disabled: true,
		label: "Disabled checkbox",
	},
};

export default meta;
export { Default, Disabled };
