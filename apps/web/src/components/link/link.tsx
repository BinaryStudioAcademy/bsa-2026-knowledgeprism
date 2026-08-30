import { type JSX, type ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import { tv, type VariantProps } from "tailwind-variants";

import { type AppRoute } from "~/lib/enums/enums.js";
import { type ValueOf } from "~/lib/types/types.js";

const getLinkClassName = tv({
	base: "w-fit rounded-sm font-medium transition-colors duration-200 focus-visible:outline-none",
	compoundVariants: [
		{
			class:
				"hover:text-error-hover hover:underline hover:decoration-1 hover:underline-offset-2 focus-visible:ring-3 focus-visible:ring-error/30",
			isDisabled: false,
			variant: "destructive",
		},
		{
			class:
				"hover:text-accent-hover hover:decoration-2 focus-visible:ring-3 focus-visible:ring-accent/35",
			isDisabled: false,
			variant: "inline",
		},
		{
			class:
				"hover:text-text hover:underline hover:decoration-1 hover:underline-offset-2 focus-visible:ring-3 focus-visible:ring-accent/35",
			isDisabled: false,
			variant: "muted",
		},
		{
			class:
				"hover:text-accent-hover focus-visible:ring-3 focus-visible:ring-accent/35",
			isDisabled: false,
			variant: "standalone",
		},
		{
			class: "opacity-35",
			isDisabled: true,
			variant: "destructive",
		},
		{
			class: "text-border",
			isDisabled: true,
			variant: ["inline", "muted", "standalone"],
		},
	],
	variants: {
		isDisabled: {
			false: "",
			true: "cursor-not-allowed",
		},
		variant: {
			destructive: "text-error no-underline",
			inline: "text-accent underline decoration-1 underline-offset-2",
			muted: "text-text-muted no-underline",
			standalone: "inline-flex items-center gap-2 text-accent no-underline",
		},
	},
});

type CommonProperties = {
	children: ReactNode;
	isDisabled?: boolean;
	variant?: VariantProps<typeof getLinkClassName>["variant"];
};

type ExternalLinkProperties = {
	href: string;
	to?: never;
};

type InternalLinkProperties = {
	href?: never;
	to: ValueOf<typeof AppRoute>;
};

type LinkContentProperties = {
	children: ReactNode;
	hasArrow: boolean;
};

type Properties = CommonProperties &
	(ExternalLinkProperties | InternalLinkProperties);

const LinkContent = ({
	children,
	hasArrow,
}: LinkContentProperties): JSX.Element => (
	<>
		{children}
		{hasArrow && <span aria-hidden="true">→</span>}
	</>
);

const Link = ({
	children,
	href,
	isDisabled = false,
	to,
	variant = "inline",
}: Properties): JSX.Element | null => {
	if (!href && !to) {
		return null;
	}

	const className = getLinkClassName({ isDisabled, variant });
	const hasArrow = variant === "standalone";

	if (isDisabled) {
		return (
			<span aria-disabled="true" className={className} role="link">
				<LinkContent hasArrow={hasArrow}>{children}</LinkContent>
			</span>
		);
	}

	if (href) {
		return (
			<a
				className={className}
				href={href}
				rel="noopener noreferrer"
				target="_blank"
			>
				<LinkContent hasArrow={hasArrow}>{children}</LinkContent>
			</a>
		);
	}

	if (to) {
		return (
			<RouterLink className={className} to={to}>
				<LinkContent hasArrow={hasArrow}>{children}</LinkContent>
			</RouterLink>
		);
	}

	return null;
};

export { Link };
