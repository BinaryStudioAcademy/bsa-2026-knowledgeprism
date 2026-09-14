import React, { useCallback, useId, useState } from "react";
import { tv } from "tailwind-variants";

import { Icon } from "~/components/icon/icon.js";
import {
	type Control,
	type FieldPath,
	type FieldValues,
	useFormController,
} from "~/hooks/hooks.js";

const inputStyles = tv({
	defaultVariants: {
		hasError: false,
		isDisabled: false,
	},
	slots: {
		errorWrapper: "mt-1 block font-sans text-xs text-error",
		iconButton:
			"absolute right-3.5 top-1/2 flex -translate-y-1/2 items-center justify-center text-text-muted transition-colors hover:text-text",
		input: [
			"block h-11 w-full appearance-none rounded-lg border px-3.5 font-sans text-sm text-text outline-none transition",
			"focus:border-accent focus:ring-3 focus:ring-accent/15",
			"disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-bg disabled:text-text-faint",
		],
		inputWrapper: "relative w-full",
		labelWrapper:
			"mb-1.5 flex items-center gap-1.5 font-sans text-sm font-medium text-text",
		wrapper: "w-full",
	},
	variants: {
		hasError: {
			false: {
				input: "border-border bg-surface",
			},
			true: {
				input:
					"border-error bg-error-bg focus:border-error focus:ring-error/15",
				labelWrapper: "text-error",
			},
		},
		isDisabled: {
			true: {
				labelWrapper: "text-text-faint",
			},
		},
	},
});

type Properties<T extends FieldValues> = {
	control: Control<T, null>;
	disabled?: boolean;
	hintInfo?: string | undefined;
	id?: string;
	isToggleablePassword?: boolean | undefined;
	label: string;
	maxLength?: number | undefined;
	name: FieldPath<T>;
	placeholder?: string;
	transformValue?: ((value: string) => string) | undefined;
	type?: "email" | "password" | "text";
};

const Input = <T extends FieldValues>({
	control,
	disabled = false,
	hintInfo,
	id,
	isToggleablePassword = false,
	label,
	maxLength,
	name,
	placeholder = "",
	transformValue,
	type = "text",
}: Properties<T>): React.JSX.Element => {
	const generatedId = useId();
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);
	const { field, fieldState } = useFormController({
		control,
		disabled,
		name,
	});

	const inputId = id ?? generatedId;
	const errorMessage = fieldState.error?.message;
	const hasError = fieldState.invalid;
	const errorId = errorMessage ? `${inputId}-error` : undefined;
	const isDisabled = field.disabled;

	const {
		errorWrapper,
		iconButton,
		input,
		inputWrapper,
		labelWrapper,
		wrapper,
	} = inputStyles({
		hasError,
		isDisabled,
	});

	const handleOnChange = useCallback(
		(event_: React.ChangeEvent<HTMLInputElement>) => {
			const newValue = transformValue
				? transformValue(event_.target.value)
				: event_.target.value;
			field.onChange(newValue);
		},
		[field, transformValue],
	);

	const handlePasswordVisibilityToggle = useCallback(() => {
		setIsPasswordVisible((previous) => !previous);
	}, []);

	const isPasswordToggleShown = type === "password" && isToggleablePassword;

	let currentType = type;

	if (isPasswordToggleShown) {
		currentType = isPasswordVisible ? "text" : "password";
	}

	return (
		<div className={wrapper()}>
			<label className={labelWrapper()} htmlFor={inputId}>
				{label}
				{hintInfo && (
					<span className="text-text-faint" title={hintInfo}>
						<Icon name="help" size={14} />
					</span>
				)}
			</label>

			<div className={inputWrapper()}>
				<input
					{...field}
					aria-describedby={errorId}
					aria-invalid={hasError}
					className={input({
						className: isPasswordToggleShown ? "pr-10" : "",
					})}
					disabled={isDisabled}
					id={inputId}
					maxLength={maxLength}
					onChange={handleOnChange}
					placeholder={placeholder}
					type={currentType}
				/>
				{isPasswordToggleShown && (
					<button
						aria-label={isPasswordVisible ? "Hide password" : "Show password"}
						className={iconButton()}
						onClick={handlePasswordVisibilityToggle}
						type="button"
					>
						<Icon name={isPasswordVisible ? "eye-off" : "eye"} size={16} />
					</button>
				)}
			</div>

			<span className={errorWrapper()} id={errorId}>
				{errorMessage || "\u{00A0}"}
			</span>
		</div>
	);
};

export { Input };
