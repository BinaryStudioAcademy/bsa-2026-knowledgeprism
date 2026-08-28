import { useCallback, useId } from "react";

import { getValidClassNames } from "~/lib/helpers/helpers.js";

type Properties = {
	error?: string;
	id?: string;
	isDisabled?: boolean;
	label?: string;
	name?: string;
	onChange: (value: string) => void;
	options: SelectOption[];
	placeholder?: string;
	value: string;
};

type SelectOption = {
	label: string;
	value: string;
};

const Select: React.FC<Properties> = ({
	error,
	id,
	isDisabled = false,
	label,
	name,
	onChange,
	options,
	placeholder,
	value,
}: Properties) => {
	const generatedId = useId();
	const hasError = Boolean(error);
	const selectId = id ?? name ?? generatedId;
	const errorId = hasError ? `${selectId}-error` : undefined;
	const handleChange = useCallback(
		(event: React.ChangeEvent<HTMLSelectElement>): void => {
			onChange(event.target.value);
		},
		[onChange],
	);

	return (
		<label className="flex flex-col gap-1.5">
			{label && (
				<span
					className={getValidClassNames("font-sans text-xs", {
						"text-error": hasError,
						"text-text": !hasError,
					})}
				>
					{label}
				</span>
			)}

			<div className="relative">
				<select
					aria-describedby={errorId}
					aria-invalid={hasError}
					className={getValidClassNames(
						"h-10 w-full appearance-none rounded-md border px-3.5 pr-9 font-sans text-sm text-text outline-none transition",
						"focus:border-accent focus:ring-3 focus:ring-accent/15",
						"disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-bg disabled:text-text-faint",
						{
							"border-border bg-surface": !hasError,
							"border-error bg-error-bg": hasError,
						},
					)}
					disabled={isDisabled}
					id={selectId}
					name={name}
					onChange={handleChange}
					value={value}
				>
					{placeholder && (
						<option disabled value="">
							{placeholder}
						</option>
					)}
					{options.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>

				<svg
					aria-hidden="true"
					className="pointer-events-none absolute right-3.5 top-1/2 h-1.5 w-2.5 -translate-y-1/2 text-text-subtle"
					fill="currentColor"
					viewBox="0 0 12 7.4"
				>
					<path d="M0 0l6 7.4L12 0z" />
				</svg>
			</div>

			{hasError && (
				<span
					className="font-sans text-xs text-error"
					id={errorId}
				>
					{error}
				</span>
			)}
		</label>
	);
};

export { Select };
export { type SelectOption };
