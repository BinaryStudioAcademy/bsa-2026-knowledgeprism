import type { Meta, StoryObj } from "@storybook/react";

import { useForm } from "react-hook-form";

import { Radio } from "./radio.js";

type FormValues = {
	visibility: string;
};

const visibilityOptions = [
	{ label: "Public", value: "public" },
	{ label: "Private", value: "private" },
];

const RadioGroupWrapper = ({
	isDisabled = false,
}: {
	isDisabled?: boolean;
}): React.JSX.Element => {
	const { control } = useForm<FormValues>({
		defaultValues: {
			visibility: "public",
		},
	});

	return (
		<div className="flex flex-col gap-3">
			{visibilityOptions.map((visibilityOption) => (
				<Radio
					control={control}
					isDisabled={isDisabled}
					key={visibilityOption.value}
					label={visibilityOption.label}
					name="visibility"
					value={visibilityOption.value}
				/>
			))}
		</div>
	);
};

const meta = {
	component: RadioGroupWrapper,
	title: "Components/Form/Radio",
} satisfies Meta<typeof RadioGroupWrapper>;

type Story = StoryObj<typeof meta>;

const Default: Story = {
	args: {
		isDisabled: false,
	},
};

const Disabled: Story = {
	args: {
		isDisabled: true,
	},
};

export default meta;
export { Default, Disabled };
