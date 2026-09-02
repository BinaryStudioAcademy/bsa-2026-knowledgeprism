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
		error: "form-error-message",
		input: "form-input",
		label: "form-label",
		labelWrapper: "block",
		wrapper: "w-full",
	},
	variants: {
		hasError: {
			true: {
				input: "is-error",
				label: "is-error",
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
