import React, { useCallback, useState } from "react";
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
	errors: FieldErrors<T>;
	label: string;
	maxLength?: number;
	name: FieldPath<T>;
	placeholder?: string;
	type?: "email" | "password" | "text";
};
const Input = <T extends FieldValues>({
	control,
	errors,
	label,
	maxLength,
	name,
	placeholder = "",
	type = "text",
}: Properties<T>): React.JSX.Element => {
	const { field } = useFormController({ control, name });
	const [isVisible, setIsVisible] = useState(false);

	const error = errors[name]?.message;
	const hasError = Boolean(error);
	const isPassword = type === "password";

	const handleToggleVisibility = useCallback((): void => {
		setIsVisible((current) => !current);
	}, []);

	const inputType = isPassword && isVisible ? "text" : type;

	return (
		<label className="flex flex-col gap-1.5">
			<span className="font-sans text-sm text-text">{label}</span>
			<div className="relative">
				<input
					{...field}
					className={getValidClassNames(
						"h-10 w-full rounded-md border bg-surface px-3.5 font-sans text-sm text-text outline-none",
						{
							"border-border focus:border-accent": !hasError,
							"border-error": hasError,
						},
					)}
					maxLength={maxLength}
					placeholder={placeholder}
					type={inputType}
				/>
				{isPassword && (
					<button
						aria-label={isVisible ? "Hide password" : "Show password"}
						className="absolute right-3 top-1/2 -translate-y-1/2 border-none bg-transparent text-text-faint"
						onClick={handleToggleVisibility}
						type="button"
					>
						<svg fill="none" height="16" viewBox="0 0 20 20" width="16">
							<path
								d="M1 10s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z"
								stroke="currentColor"
								strokeWidth="1.4"
							/>
							<circle
								cx="10"
								cy="10"
								r="2.5"
								stroke="currentColor"
								strokeWidth="1.4"
							/>
							{!isVisible && (
								<path d="M3 3l14 14" stroke="currentColor" strokeWidth="1.4" />
							)}
						</svg>
					</button>
				)}
			</div>
			{hasError && (
				<span className="font-sans text-xs text-error">{error as string}</span>
			)}
		</label>
	);
};

export { Input };
