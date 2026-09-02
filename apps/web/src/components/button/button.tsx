import { type ComponentPropsWithRef, type JSX, type ReactNode } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const buttonStyles = tv({
	slots: {
		base: "btn inline-flex items-center justify-center gap-2 leading-normal transition-colors",
		spinner:
			"inline-block size-3.5 animate-spin rounded-full border-2 border-current/20 border-t-current",
		content: "",
	},
	variants: {
		variant: {
			destructive: {
				base: "btn-destructive",
				spinner: "border-white/35 border-t-white",
			},
			ghost: {
				base: "btn-ghost",
			},
			icon: {
				base: "btn-icon border border-border",
				spinner: "border-text/20 border-t-text absolute inset-0 m-auto",
			},
			primary: {
				base: "btn-primary",
				spinner: "border-white/35 border-t-white",
			},
			secondary: {
				base: "btn-secondary",
				spinner: "border-text/20 border-t-text",
			},
		},
		isLoading: {
			true: {},
			false: {},
		},
	},
	compoundVariants: [
		{
			class: {
				base: "opacity-85 disabled:!bg-error disabled:!text-primary-fg",
			},
			isLoading: true,
			variant: "destructive",
		},
		{
			class: {
				base: "disabled:!bg-transparent disabled:!text-text-muted",
			},
			isLoading: true,
			variant: "ghost",
		},
		{
			class: {
				base: "relative disabled:!border-border disabled:!text-text",
			},
			isLoading: true,
			variant: "icon",
		},
		{
			class: {
				base: "opacity-85 disabled:!bg-primary disabled:!text-primary-fg",
			},
			isLoading: true,
			variant: "primary",
		},
		{
			class: {
				base: "disabled:!bg-surface disabled:!border-border disabled:!text-text-muted",
			},
			isLoading: true,
			variant: "secondary",
		},
		{
			class: {
				content: "invisible",
			},
			isLoading: true,
			variant: ["ghost", "icon"],
		},
	],
	defaultVariants: {
		isLoading: false,
		variant: "primary",
	},
});

type Properties = ComponentPropsWithRef<"button"> &
	VariantProps<typeof buttonStyles> & {
		children: ReactNode;
		isLoading?: boolean;
	};

const Button = ({
	children,
	className,
	disabled = false,
	isLoading = false,
	type = "button",
	variant = "primary",
	...properties
}: Properties): JSX.Element => {
	const { base, content, spinner } = buttonStyles({
		isLoading,
		variant,
	});

	return (
		<button
			aria-busy={isLoading}
			className={base({ className })}
			disabled={disabled || isLoading}
			type={type}
			{...properties}
		>
			{isLoading && variant !== "ghost" && (
				<span aria-hidden="true" className={spinner()} />
			)}
			<span className={content()}>{children}</span>
		</button>
	);
};

export { Button };
