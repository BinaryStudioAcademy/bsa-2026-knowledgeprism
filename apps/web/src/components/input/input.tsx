import React, { useId } from "react";
import {
	type Control,
	type FieldErrors,
	type FieldPath,
	type FieldValues,
} from "react-hook-form";

import { useFormController } from "~/hooks/hooks.js";
import { getClassNames } from "~/lib/helpers/helpers.js";

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
		<div className="flex flex-col gap-1.5 w-full">
			<label
				className={getClassNames("form-label", hasError && "is-error")}
				htmlFor={id}
			>
				{label}
			</label>
			<input
				{...field}
				className={getClassNames("form-input", hasError && "is-error")}
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
