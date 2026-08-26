import React, { useId } from "react";
import {
	type Control,
	type FieldErrors,
	type FieldPath,
	type FieldValues,
} from "react-hook-form";

import { useFormController } from "~/hooks/hooks.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";

type Properties<T extends FieldValues> = {
	control: Control<T, null>;
	disabled?: boolean;
	errors: FieldErrors<T>;
	label: string;
	name: FieldPath<T>;
	placeholder?: string;
	type?: "email" | "password" | "text";
};

const Input = <T extends FieldValues>({
	control,
	disabled = false,
	errors,
	label,
	name,
	placeholder = "",
	type = "text",
}: Properties<T>): React.JSX.Element => {
	const { field } = useFormController({ control, name });
	const id = useId();

	const error = errors[name]?.message;
	const hasError = Boolean(error);

	return (
		<div className="flex w-full flex-col gap-1.5">
			<label
				className={getValidClassNames("form-label", hasError && "is-error")}
				htmlFor={id}
			>
				{label}
			</label>
			<input
				{...field}
				className={getValidClassNames("form-input", hasError && "is-error")}
				disabled={disabled}
				id={id}
				placeholder={placeholder}
				type={type}
			/>
			{hasError && (
				<span className="form-error-message">{error as string}</span>
			)}
		</div>
	);
};

export { Input };
