import type { Meta, StoryObj } from "@storybook/react";

import { type ComponentProps, type JSX, useCallback, useState } from "react";

import { Toggle } from "./toggle.js";

const meta = {
	component: Toggle,
	title: "Components/Form/Toggle",
} satisfies Meta<typeof Toggle>;

type Story = StoryObj<typeof meta>;

const ToggleWrapper = (
	properties: ComponentProps<typeof Toggle>,
): JSX.Element => {
	const { onChange } = properties;
	const [isChecked, setIsChecked] = useState(properties.isChecked);

	const handleChange = useCallback(
		(isChecked: boolean): void => {
			setIsChecked(isChecked);
			onChange(isChecked);
		},
		[onChange],
	);

	return (
		<Toggle {...properties} isChecked={isChecked} onChange={handleChange} />
	);
};

const Default: Story = {
	args: {
		isChecked: false,
		label: "Enable AI auto-tagging",
		onChange: () => {},
	},
	render: (properties) => <ToggleWrapper {...properties} />,
};

const Checked: Story = {
	args: {
		isChecked: true,
		label: "Two-factor authentication",
		onChange: () => {},
	},
	render: (properties) => <ToggleWrapper {...properties} />,
};

const Disabled: Story = {
	args: {
		isChecked: false,
		isDisabled: true,
		label: "Enterprise SSO (disabled)",
		onChange: () => {},
	},
	render: (properties) => <ToggleWrapper {...properties} />,
};

export default meta;
export { Checked, Default, Disabled };
