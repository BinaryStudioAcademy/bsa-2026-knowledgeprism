import React, { useCallback } from "react";
import {
	type Control,
	type FieldPath,
	type FieldValues,
	useController,
} from "react-hook-form";

type Properties<T extends FieldValues = FieldValues> = {
	control: Control<T>;
	disabled?: boolean;
	label: React.ReactNode;
	name: FieldPath<T>;
};

const Checkbox = <T extends FieldValues = FieldValues>({
	control,
	disabled = false,
	label,
	name,
}: Properties<T>): React.JSX.Element => {
	const { field, fieldState } = useController({ control, name });
	const { name: fieldName, onBlur, onChange, ref, value } = field;

	const error = fieldState.error;
	const errorMessage = error?.message;
	const hasError = Boolean(errorMessage);

	const handleChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>): void => {
			onChange(event.target.checked);
		},
		[onChange],
	);

	return (
		<div className="flex flex-col gap-1">
			<label className="flex items-center gap-2 text-text">
				<input
					checked={Boolean(value)}
					className="h-4 w-4 rounded border-border text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
					disabled={disabled}
					name={fieldName}
					onBlur={onBlur}
					onChange={handleChange}
					ref={ref}
					type="checkbox"
				/>
				{label && <span>{label}</span>}
			</label>
			{hasError && <span className="text-xs text-error">{errorMessage}</span>}
		</div>
	);
};

export { Checkbox };
