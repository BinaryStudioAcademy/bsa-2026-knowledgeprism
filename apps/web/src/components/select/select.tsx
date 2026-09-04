import { type ChangeEvent, type JSX, useCallback, useId } from "react";
import { tv } from "tailwind-variants";

const selectStyles = tv({
	defaultVariants: {
		hasError: false,
		isDisabled: false,
	},
	slots: {
		container: "relative",
		errorWrapper: "mt-1 block font-sans text-xs text-error",
		icon: "pointer-events-none absolute right-3.5 top-1/2 h-1.5 w-2.5 -translate-y-1/2 text-text-subtle",
		labelWrapper: "mb-1.5 block font-sans text-sm font-medium text-text",
		select: [
			"block h-11 w-full appearance-none rounded-lg border px-3.5 pr-9 font-sans text-sm text-text outline-none transition",
			"focus:border-accent focus:ring-3 focus:ring-accent/15",
			"cursor-pointer disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-bg disabled:text-text-faint",
		],
		wrapper: "w-full",
	},
	variants: {
		hasError: {
			false: {
				select: "border-border bg-surface",
			},
			true: {
				labelWrapper: "text-error",
				select:
					"border-error bg-error-bg focus:border-error focus:ring-error/15",
			},
		},
		isDisabled: {
			true: {
				labelWrapper: "text-text-faint",
			},
		},
	},
});

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

	const { container, errorWrapper, icon, labelWrapper, select, wrapper } =
		selectStyles({ hasError, isDisabled });

	const handleChange = useCallback(
		(event: ChangeEvent<HTMLSelectElement>): void => {
			onChange(event.target.value);
		},
		[onChange],
	);

	return (
		<div className={wrapper()}>
			{label && (
				<label className={labelWrapper()} htmlFor={selectId}>
					{label}
				</label>
			)}

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
		</div>
	);
};

export { Select };
export { type SelectOption };
