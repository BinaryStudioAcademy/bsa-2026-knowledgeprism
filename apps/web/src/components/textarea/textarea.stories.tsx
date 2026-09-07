import type { Meta, StoryObj } from "@storybook/react";

import { type ComponentProps, type JSX } from "react";
import { useForm } from "react-hook-form";

import { Textarea } from "./textarea.js";

const meta = {
	component: Textarea,
	title: "Components/Form/Textarea",
} satisfies Meta<typeof Textarea>;

type Story = StoryObj<typeof meta>;

const TextareaWrapper = (
	properties: ComponentProps<typeof Textarea>,
): JSX.Element => {
	const { control } = useForm({
		defaultValues: {
			comment: "",
		},
	});

	return <Textarea {...properties} control={control} name="comment" />;
};

const Default: Story = {
	args: {
		control: {} as never,
		label: "Description",
		name: "comment",
	},
	render: (properties) => <TextareaWrapper {...properties} />,
};

const WithPlaceholder: Story = {
	args: {
		control: {} as never,
		label: "Notes",
		name: "comment",
		placeholder: "Enter your notes here...",
	},
	render: (properties) => <TextareaWrapper {...properties} />,
};

const Disabled: Story = {
	args: {
		control: {} as never,
		disabled: true,
		label: "Read-only comment",
		name: "comment",
		placeholder: "Disabled textarea",
	},
	render: (properties) => <TextareaWrapper {...properties} />,
};

export default meta;
export { Default, Disabled, WithPlaceholder };
