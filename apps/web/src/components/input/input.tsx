import React, { useCallback, useId, useState } from "react";
import { tv } from "tailwind-variants";

import { Icon } from "~/components/icon/icon.js";
import {
	type Control,
	type FieldPath,
	type FieldValues,
	useFormController,
} from "~/hooks/hooks.js";

const TOGGLE_ICON_SIZE = 16;

const inputStyles = tv({
	defaultVariants: {
		hasError: false,
		isDisabled: false,
		isPassword: false,
	},
	slots: {
		errorWrapper: "mt-1 block font-sans text-xs text-error",
		input: [
			"block h-11 w-full appearance-none rounded-lg border px-3.5 font-sans text-sm text-text outline-none transition",
			"focus:border-accent focus:ring-3 focus:ring-accent/15",
			"disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-bg disabled:text-text-faint",
		],
		inputWrapper: "relative",
		labelWrapper: "mb-1.5 block font-sans text-sm font-medium text-text",
		toggleButton: [
			"absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-text-muted transition hover:text-text",
			"disabled:cursor-not-allowed disabled:text-text-faint",
		],
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
		isPassword: {
			true: {
				input: "pr-10",
			},
		},
	},
});

type Properties<T extends FieldValues> = {
	control: Control<T, null>;
	disabled?: boolean;
	id?: string;
	label: string;
	name: FieldPath<T>;
	placeholder?: string;
	type?: "email" | "password" | "text";
};

const Input = <T extends FieldValues>({
	control,
	disabled = false,
	id,
	label,
	name,
	placeholder = "",
	type = "text",
}: Properties<T>): React.JSX.Element => {
	const generatedId = useId();
	const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
	const { field, fieldState } = useFormController({
		control,
		disabled,
		name,
	});

	const isPassword = type === "password";
	const inputId = id ?? generatedId;
	const errorMessage = fieldState.error?.message;
	const hasError = fieldState.invalid;
	const errorId = errorMessage ? `${inputId}-error` : undefined;
	const isDisabled = field.disabled;
	const inputType = isPassword && isPasswordVisible ? "text" : type;

	const handleToggleVisibility = useCallback((): void => {
		setIsPasswordVisible(
			(previousIsPasswordVisible) => !previousIsPasswordVisible,
		);
	}, []);

	const {
		errorWrapper,
		input,
		inputWrapper,
		labelWrapper,
		toggleButton,
		wrapper,
	} = inputStyles({
		hasError,
		isDisabled,
		isPassword,
	});

	return (
		<div className={wrapper()}>
			<label className={labelWrapper()} htmlFor={inputId}>
				{label}
			</label>

			<div className={inputWrapper()}>
				<input
					{...field}
					aria-describedby={errorId}
					aria-invalid={hasError}
					className={input()}
					disabled={isDisabled}
					id={inputId}
					placeholder={placeholder}
					type={inputType}
				/>

				{isPassword && (
					<button
						aria-label={isPasswordVisible ? "Hide password" : "Show password"}
						className={toggleButton()}
						disabled={isDisabled}
						onClick={handleToggleVisibility}
						type="button"
					>
						<Icon
							name={isPasswordVisible ? "eye-off" : "eye"}
							size={TOGGLE_ICON_SIZE}
						/>
					</button>
				)}
			</div>

			{errorMessage && (
				<span className={errorWrapper()} id={errorId}>
					{errorMessage}
				</span>
			)}
		</div>
	);
};

export { Input };
