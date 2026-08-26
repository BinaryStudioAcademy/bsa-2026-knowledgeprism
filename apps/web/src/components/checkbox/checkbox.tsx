import React from "react";
import {
	get,
	type Control,
	type FieldErrors,
	type FieldPath,
	type FieldValues,
} from "react-hook-form";

import { useFormController } from "~/hooks/hooks.js";

type Properties<T extends FieldValues = FieldValues> = {
	control: Control<T, null>;
	errors: FieldErrors<T>;
	label: string;
	name: FieldPath<T>;
	disabled?: boolean;
};

const Checkbox = <T extends FieldValues = FieldValues>({
	control,
	errors,
	label,
	name,
	disabled = false,
}: Properties<T>) => {
	const { field } = useFormController({ control, name });
	const error = get(errors, name);
	const errorMessage = error?.message as string | undefined;
	const hasError = Boolean(errorMessage);

	return (
		<div className="flex flex-col gap-1">
			<label className="flex items-center gap-2 cursor-pointer select-none has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
				<input
					{...field}
					type="checkbox"
					checked={Boolean(field.value)}
					disabled={disabled}
					onChange={(event) => field.onChange(event.target.checked)}
					className="h-4 w-4 rounded border-gray-300 text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
				/>
				<span className="text-sm text-gray-700">{label}</span>
			</label>
			{hasError && <span className="text-xs text-red-500">{errorMessage}</span>}
		</div>
	);
};

export { Checkbox };
