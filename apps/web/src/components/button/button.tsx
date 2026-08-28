import type { ButtonHTMLAttributes, JSX, ReactNode } from "react";

import { clsx } from "clsx";

type ButtonVariant = "destructive" | "ghost" | "icon" | "primary" | "secondary";

const lightSpinnerClassName = "border-white/35 border-t-white";
const darkSpinnerClassName = "border-text/20 border-t-text";

const buttonVariants: Record<
	ButtonVariant,
	{
		disabled: string;
		loading: string;
		spinner: string;
	}
> = {
	destructive: {
		disabled: "disabled:text-error-disabled",
		loading: "opacity-85 disabled:!bg-error disabled:!text-primary-fg",
		spinner: lightSpinnerClassName,
	},
	ghost: {
		disabled: "disabled:text-text-disabled",
		loading: "disabled:!bg-transparent disabled:!text-text-muted",
		spinner: "",
	},
	icon: {
		disabled: "disabled:border-border-subtle disabled:text-text-disabled",
		loading: "relative disabled:!border-border disabled:!text-text",
		spinner: darkSpinnerClassName,
	},
	primary: {
		disabled: "disabled:text-text-faint",
		loading: "opacity-85 disabled:!bg-primary disabled:!text-primary-fg",
		spinner: lightSpinnerClassName,
	},
	secondary: {
		disabled: "disabled:border-border-subtle disabled:text-text-disabled",
		loading:
			"disabled:!bg-surface disabled:!border-border disabled:!text-text-muted",
		spinner: darkSpinnerClassName,
	},
};

type Properties = ButtonHTMLAttributes<HTMLButtonElement> & {
	children: ReactNode;
	isLoading?: boolean;
	variant?: ButtonVariant;
};

const Button = ({
	children,
	className = "",
	disabled = false,
	isLoading = false,
	type = "button",
	variant = "primary",
	...properties
}: Properties): JSX.Element => {
	const variantStyles = buttonVariants[variant];
	const combinedClasses = clsx(
		"btn",
		`btn-${variant}`,
		"inline-flex items-center justify-center gap-2 leading-normal transition-colors",
		variant === "icon" && "border border-border",
		isLoading ? variantStyles.loading : variantStyles.disabled,
		className,
	);

	return (
		<button
			aria-busy={isLoading}
			className={combinedClasses}
			disabled={disabled || isLoading}
			type={type}
			{...properties}
		>
			{isLoading && variant !== "ghost" && (
				<Spinner
					className={clsx(
						variantStyles.spinner,
						variant === "icon" && "absolute inset-0 m-auto",
					)}
				/>
			)}
			<span
				className={clsx(
					isLoading &&
						(variant === "ghost" || variant === "icon") &&
						"invisible",
				)}
			>
				{children}
			</span>
		</button>
	);
};

const Spinner = ({ className = "" }: { className?: string }): JSX.Element => (
	<span
		aria-hidden="true"
		className={clsx(
			"inline-block size-3.5 animate-spin rounded-full border-2 border-current/20 border-t-current",
			className,
		)}
	/>
);

export { Button };
