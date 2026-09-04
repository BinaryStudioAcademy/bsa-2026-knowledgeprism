import { type JSX, useId } from "react";
import {
	type Control,
	type FieldPath,
	type FieldValues,
} from "react-hook-form";
import { tv } from "tailwind-variants";

import { useFormController } from "~/hooks/hooks.js";

const textareaStyles = tv({
	defaultVariants: {
		hasError: false,
		isDisabled: false,
	},
	slots: {
		container: "w-full",
		errorWrapper: "mt-1 block font-sans text-xs text-error",
		labelWrapper: "mb-1.5 block font-sans text-sm font-medium text-text",
		textarea: [
			"block w-full appearance-none rounded-lg border px-3.5 py-2.5 font-sans text-sm text-text outline-none transition",
			"focus:border-accent focus:ring-3 focus:ring-accent/15",
			"disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-bg disabled:text-text-faint",
			"resize-y",
		],
	},
	variants: {
		hasError: {
			false: {
				textarea: "border-border bg-surface",
			},
			true: {
				labelWrapper: "text-error",
				textarea:
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
	const isDisabled = field.disabled;

	const { container, errorWrapper, labelWrapper, textarea } = textareaStyles({
		hasError,
		isDisabled,
	});

	return (
		<div className={container()}>
			<label className={labelWrapper()} htmlFor={textareaId}>
				{label}
			</label>

			<textarea
				{...field}
				aria-describedby={errorId}
				aria-invalid={hasError}
				className={textarea({ className })}
				disabled={isDisabled}
				id={textareaId}
				placeholder={placeholder}
				rows={rows}
			/>

			{errorMessage && (
				<span className={errorWrapper()} id={errorId}>
					{errorMessage}
				</span>
			)}
		</div>
	);
};

export { Textarea };
