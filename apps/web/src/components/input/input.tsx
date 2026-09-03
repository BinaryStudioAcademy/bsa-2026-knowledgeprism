import React from "react";
import { tv } from "tailwind-variants";

import {
	type Control,
	type FieldPath,
	type FieldValues,
	useFormController,
} from "~/hooks/hooks.js";

const inputStyles = tv({
	slots: {
		error: "mt-1 text-[12px] text-error",
		input: [
			"h-10 w-full rounded-md border border-border bg-surface px-3.5 font-sans text-[14px] text-text transition-colors",
			"focus:border-accent focus:outline-none focus:ring-3 focus:ring-accent/15",
			"disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-bg disabled:text-text-faint",
		],
		label: "mb-1.5 block font-sans text-[12px] font-medium text-text",
		labelWrapper: "block",
		wrapper: "w-full",
	},
	variants: {
		hasError: {
			true: {
				input: "border-error bg-error-bg",
				label: "text-error",
			},
		},
	},
});

type Properties<T extends FieldValues> = {
	control: Control<T, null>;
	disabled?: boolean;
	label: string;
	name: FieldPath<T>;
	placeholder?: string;
	type?: "email" | "password" | "text";
};

const Input = <T extends FieldValues>({
	control,
	disabled = false,
	label,
	name,
	placeholder = "",
	type = "text",
}: Properties<T>): React.JSX.Element => {
	const { field, fieldState } = useFormController({ control, name });

	const error = fieldState.error;
	const errorMessage = error?.message;
	const hasError = Boolean(errorMessage);

	const {
		error: errorStyle,
		input,
		label: labelStyle,
		labelWrapper,
		wrapper,
	} = inputStyles({ hasError });

	return (
		<div className={wrapper()}>
			<label className={labelWrapper()}>
				<span className={labelStyle()}>{label}</span>
				<input
					{...field}
					className={input()}
					disabled={disabled}
					placeholder={placeholder}
					type={type}
				/>
			</label>
			{hasError && (
				<span className={errorStyle()}>{errorMessage as string}</span>
			)}
		</div>
	);
};

export { Input };
