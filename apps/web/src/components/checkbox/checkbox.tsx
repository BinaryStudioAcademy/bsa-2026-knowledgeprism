import React, { useCallback, useId } from "react";
import {
	type Control,
	type FieldPath,
	type FieldValues,
} from "react-hook-form";
import { tv } from "tailwind-variants";

import { useFormController } from "~/hooks/hooks.js";

import { Icon } from "../icon/icon.js";

const checkboxStyles = tv({
	compoundVariants: [
		{
			class: {
				box: "border-error peer-focus-visible:ring-error",
			},
			hasError: true,
			isChecked: false,
		},
		{
			class: {
				box: "border-border peer-focus-visible:ring-accent",
			},
			hasError: false,
			isChecked: false,
		},
	],
	defaultVariants: {
		hasError: false,
		isChecked: false,
		isDisabled: false,
	},
	slots: {
		box: [
			"flex size-4.5 shrink-0 items-center justify-center rounded border bg-surface transition-colors duration-150",
			"peer-focus-visible:outline-none peer-focus-visible:ring-2",
			"peer-disabled:opacity-50",
		],
		errorMessageStyle: "text-xs text-error",
		icon: "text-primary-fg transition-opacity duration-150",
		input: "peer sr-only",
		labelText: "",
		labelWrapper:
			"flex select-none items-center gap-2.5 font-sans text-sm text-text",
		wrapper: "flex flex-col gap-1",
	},
	variants: {
		hasError: {
			false: "",
			true: "",
		},
		isChecked: {
			false: {
				icon: "opacity-0",
			},
			true: {
				box: "border-accent bg-accent peer-focus-visible:ring-accent",
				icon: "opacity-100",
			},
		},
		isDisabled: {
			false: {
				box: "cursor-pointer",
				labelText: "cursor-pointer",
				labelWrapper: "cursor-pointer",
			},
			true: {
				box: "cursor-not-allowed",
				labelText: "cursor-not-allowed",
				labelWrapper: "cursor-not-allowed",
			},
		},
	},
});

type Properties<T extends FieldValues = FieldValues> = {
	control: Control<T>;
	disabled?: boolean;
	id?: string;
	label: React.ReactNode;
	name: FieldPath<T>;
};

const Checkbox = <T extends FieldValues = FieldValues>({
	control,
	disabled = false,
	id,
	label,
	name,
}: Properties<T>): React.JSX.Element => {
	const generatedId = useId();
	const checkboxId = id ?? generatedId;
	const { field, fieldState } = useFormController({
		control,
		disabled,
		name,
	});
	const { name: fieldName, onBlur, onChange, ref, value } = field;

	const errorMessage = fieldState.error?.message;
	const hasError = Boolean(errorMessage);
	const isChecked = Boolean(value);
	const errorId = hasError && !isChecked ? `${checkboxId}-error` : undefined;

	const handleChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>): void => {
			onChange(event.target.checked);
		},
		[onChange],
	);

	const {
		box,
		errorMessageStyle,
		icon,
		input,
		labelText,
		labelWrapper,
		wrapper,
	} = checkboxStyles({ hasError, isChecked, isDisabled: disabled });

	return (
		<div className={wrapper()}>
			<div className={labelWrapper()}>
				<input
					aria-describedby={errorId}
					aria-invalid={hasError}
					checked={isChecked}
					className={input()}
					disabled={disabled}
					id={checkboxId}
					name={fieldName}
					onBlur={onBlur}
					onChange={handleChange}
					ref={ref}
					type="checkbox"
				/>
				<label aria-hidden="true" className={box()} htmlFor={checkboxId}>
					<div className={icon()}>
						<Icon name="checkbox-tick" size={10} />
					</div>
				</label>
				{label && (
					<label className={labelText()} htmlFor={checkboxId}>
						{label}
					</label>
				)}
			</div>
			{hasError && !isChecked && (
				<span className={errorMessageStyle()} id={errorId}>
					{errorMessage}
				</span>
			)}
		</div>
	);
};

export { Checkbox };
