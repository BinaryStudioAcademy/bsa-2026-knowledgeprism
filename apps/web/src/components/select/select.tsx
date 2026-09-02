import { type ChangeEvent, type JSX, useCallback, useId } from "react";
import { tv } from "tailwind-variants";

const selectStyles = tv({
	slots: {
		container: "relative",
		errorWrapper: "font-sans text-xs text-error",
		icon: "pointer-events-none absolute right-3.5 top-1/2 h-1.5 w-2.5 -translate-y-1/2 text-text-subtle",
		labelWrapper: "flex flex-col gap-1.5",
		labelText: "font-sans text-xs text-text",
		select: [
			"h-10 w-full appearance-none rounded-md border px-3.5 pr-9 font-sans text-sm text-text outline-none transition",
			"focus:border-accent focus:ring-3 focus:ring-accent/15",
			"disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-bg disabled:text-text-faint",
		],
	},
	variants: {
		hasError: {
			false: {
				select: "border-border bg-surface",
			},
			true: {
				labelText: "text-error",
				select: "border-error bg-error-bg",
			},
		},
	},
	defaultVariants: {
		hasError: false,
	},
});

type SelectOption = {
	label: string;
	value: string;
};

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

const Select = ({
	error,
	id,
	isDisabled = false,
	label,
	name,
	onChange,
	options,
	placeholder,
	value,
}: Properties): JSX.Element => {
	const generatedId = useId();
	const hasError = Boolean(error);
	const selectId = id ?? name ?? generatedId;
	const errorId = hasError ? `${selectId}-error` : undefined;

	const { container, errorWrapper, icon, labelText, labelWrapper, select } =
		selectStyles({ hasError });

	const handleChange = useCallback(
		(event: ChangeEvent<HTMLSelectElement>): void => {
			onChange(event.target.value);
		},
		[onChange],
	);

	return (
		<label className={labelWrapper()}>
			{label && <span className={labelText()}>{label}</span>}

			<div className={container()}>
				<select
					{...(errorId && { "aria-describedby": errorId })}
					aria-invalid={hasError}
					className={select()}
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
					className={icon()}
					fill="currentColor"
					viewBox="0 0 12 7.4"
				>
					<path d="M0 0l6 7.4L12 0z" />
				</svg>
			</div>

			{hasError && (
				<span className={errorWrapper()} id={errorId}>
					{error}
				</span>
			)}
		</label>
	);
};

export { Select };
export { type SelectOption };
