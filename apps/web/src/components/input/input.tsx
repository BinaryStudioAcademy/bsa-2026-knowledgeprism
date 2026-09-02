import React from "react";

import {
	type Control,
	type FieldPath,
	type FieldValues,
	useFormController,
} from "~/hooks/hooks.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";

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

	return (
		<div className="w-full">
			<label className="block">
				<span
					className={getValidClassNames("form-label", hasError && "is-error")}
				>
					{label}
				</span>
				<input
					{...field}
					className={getValidClassNames("form-input", hasError && "is-error")}
					disabled={disabled}
					placeholder={placeholder}
					type={type}
				/>
			</label>
			{hasError && (
				<span className="form-error-message">{errorMessage as string}</span>
			)}
		</div>
	);
};

export { Input };
