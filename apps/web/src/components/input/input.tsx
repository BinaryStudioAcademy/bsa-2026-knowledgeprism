import React, { useId } from "react";
import { tv } from "tailwind-variants";

import {
	type Control,
	type FieldPath,
	type FieldValues,
	useFormController,
} from "~/hooks/hooks.js";

const inputStyles = tv({
	defaultVariants: {
		hasError: false,
		isDisabled: false,
	},
	slots: {
		errorWrapper: "mt-1 block font-sans text-xs text-error",
		input: [
			"block h-11 w-full appearance-none rounded-lg border px-3.5 font-sans text-sm text-text outline-none transition",
			"focus:border-accent focus:ring-3 focus:ring-accent/15",
			"disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-bg disabled:text-text-faint",
		],
		labelWrapper: "mb-1.5 block font-sans text-sm font-medium text-text",
		wrapper: "w-full",
	},
	variants: {
		hasError: {
			false: {
				input: "border-border bg-surface",
			},
			true: {
				input:
					"border-error bg-error-bg focus:border-error focus:ring-error/15",
				labelWrapper: "text-error",
			},
		},
		isDisabled: {
			true: {
				labelWrapper: "text-text-faint",
			},
		},
	},
});

type Properties<T extends FieldValues> = {
	control: Control<T, null>;
	disabled?: boolean;
	id?: string;
	label: string;
	name: FieldPath<T>;
	placeholder?: string;
	type?: "email" | "password" | "text";
};

const Input = <T extends FieldValues>({
	control,
	disabled = false,
	id,
	label,
	name,
	placeholder = "",
	type = "text",
}: Properties<T>): React.JSX.Element => {
	const generatedId = useId();
	const { field, fieldState } = useFormController({
		control,
		disabled,
		name,
	});

	const inputId = id ?? generatedId;
	const errorMessage = fieldState.error?.message;
	const hasError = fieldState.invalid;
	const errorId = errorMessage ? `${inputId}-error` : undefined;
	const isDisabled = field.disabled;

	const { errorWrapper, input, labelWrapper, wrapper } = inputStyles({
		hasError,
		isDisabled,
	});

	return (
		<div className={wrapper()}>
			<label className={labelWrapper()} htmlFor={inputId}>
				{label}
			</label>

			<input
				{...field}
				aria-describedby={errorId}
				aria-invalid={hasError}
				className={input()}
				disabled={isDisabled}
				id={inputId}
				placeholder={placeholder}
				type={type}
			/>

			{errorMessage && (
				<span className={errorWrapper()} id={errorId}>
					{errorMessage}
				</span>
			)}
		</div>
	);
};

export { Input };
