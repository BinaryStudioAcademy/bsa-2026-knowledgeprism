import { type JSX, useId } from "react";
import {
	type Control,
	type FieldPath,
	type FieldValues,
} from "react-hook-form";

import { useFormController } from "~/hooks/hooks.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";

const DEFAULT_TEXTAREA_ROWS = 3;

type Properties<T extends FieldValues = FieldValues> = {
	className?: string;
	control: Control<T>;
	disabled?: boolean;
	id?: string;
	label: string;
	name: FieldPath<T>;
	placeholder?: string;
	rows?: number;
};

const Textarea = <T extends FieldValues = FieldValues>({
	className,
	control,
	disabled = false,
	id,
	label,
	name,
	placeholder = "",
	rows = DEFAULT_TEXTAREA_ROWS,
}: Properties<T>): JSX.Element => {
	const generatedId = useId();
	const { field, fieldState } = useFormController({
		control,
		disabled,
		name,
	});

	const textareaId = id ?? generatedId;
	const errorMessage = fieldState.error?.message;
	const hasError = fieldState.invalid;
	const errorId = errorMessage ? `${textareaId}-error` : undefined;

	return (
		<div className="w-full">
			<label
				className={getValidClassNames(
					"form-label",
					hasError && "is-error",
					field.disabled && "text-text-faint",
				)}
				htmlFor={textareaId}
			>
				{label}
			</label>

			<textarea
				{...field}
				aria-describedby={errorId}
				aria-invalid={hasError}
				className={getValidClassNames(
					"form-textarea block",
					hasError && "is-error",
					className,
				)}
				disabled={field.disabled}
				id={textareaId}
				placeholder={placeholder}
				rows={rows}
			/>

			{errorMessage && (
				<span className="form-error-message block" id={errorId}>
					{errorMessage}
				</span>
			)}
		</div>
	);
};

export { Textarea };
