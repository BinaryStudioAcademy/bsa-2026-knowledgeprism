import type { Meta, StoryObj } from "@storybook/react";

import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { RadioGroup } from "./radio-group.js";

type FormValues = {
	visibility: string;
};

const visibilityOptions = [
	{ label: "Public", value: "public" },
	{ label: "Private", value: "private" },
];

const RadioGroupWrapper = ({
	hasError = false,
	isDisabled = false,
}: {
	hasError?: boolean;
	isDisabled?: boolean;
}): React.JSX.Element => {
	const { control, setError } = useForm<FormValues>({
		defaultValues: {
			visibility: "public",
		},
	});

	useEffect(() => {
		if (hasError) {
			setError("visibility", { message: "Please choose a visibility option" });
		}
	}, [hasError, setError]);

	return (
		<RadioGroup
			control={control}
			isDisabled={isDisabled}
			name="visibility"
			options={visibilityOptions}
		/>
	);
};

const meta = {
	component: RadioGroupWrapper,
	title: "Components/Form/RadioGroup",
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

const WithError: Story = {
	args: {
		hasError: true,
	},
};

export default meta;
export { Default, Disabled, WithError };
