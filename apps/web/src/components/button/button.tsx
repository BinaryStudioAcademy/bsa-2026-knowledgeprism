import { type ComponentPropsWithRef, type JSX, type ReactNode } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const buttonStyles = tv({
	slots: {
		base: [
			"inline-flex items-center justify-center gap-2 px-5 py-2.5 font-sans text-[13px] font-medium leading-normal transition-colors rounded-md",
			"focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent/35",
			"disabled:cursor-not-allowed",
		],
		spinner:
			"inline-block size-3.5 animate-spin rounded-full border-2 border-current/20 border-t-current",
		content: "",
	},
	variants: {
		variant: {
			destructive: {
				base: [
					"bg-error text-primary-fg",
					"hover:bg-error-hover",
					"focus-visible:ring-3 focus-visible:ring-error/30",
					"disabled:bg-error-bg disabled:text-error-disabled",
				],
				spinner: "border-white/35 border-t-white",
			},
			ghost: {
				base: [
					"bg-transparent text-text",
					"hover:bg-border-subtle",
					"disabled:bg-transparent disabled:text-text-disabled",
				],
			},
			icon: {
				base: [
					"size-9 p-0 bg-transparent border border-border",
					"hover:bg-border-subtle",
					"disabled:border-border-subtle disabled:text-text-disabled",
				],
				spinner: "border-text/20 border-t-text absolute inset-0 m-auto",
			},
			primary: {
				base: [
					"bg-primary text-primary-fg",
					"hover:bg-primary-hover",
					"disabled:bg-border-subtle disabled:text-text-faint",
				],
				spinner: "border-white/35 border-t-white",
			},
			secondary: {
				base: [
					"bg-surface text-text border border-border",
					"hover:bg-border-subtle",
					"disabled:bg-surface disabled:border-border-subtle disabled:text-text-disabled",
				],
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
