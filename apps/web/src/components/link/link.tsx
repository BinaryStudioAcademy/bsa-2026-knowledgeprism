import { type ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";

import { type AppRoute } from "~/lib/enums/enums.js";
import { type ValueOf } from "~/lib/types/types.js";

type LinkVariant = "destructive" | "inline" | "muted" | "standalone";

type Properties = {
	children: ReactNode;
	isDisabled?: boolean;
	to: ValueOf<typeof AppRoute>;
	variant?: LinkVariant;
};

const BASE_CLASS_NAME =
	"w-fit rounded-sm font-medium transition-colors duration-200 focus-visible:outline-none";

const CLASS_NAMES_BY_VARIANT = {
	destructive: {
		disabled: "cursor-not-allowed text-error opacity-35 no-underline",
		enabled:
			"text-error no-underline hover:text-error-hover hover:underline hover:decoration-1 hover:underline-offset-2 focus-visible:ring-3 focus-visible:ring-error/30",
	},
	inline: {
		disabled:
			"cursor-not-allowed text-border underline decoration-1 underline-offset-2",
		enabled:
			"text-accent underline decoration-1 underline-offset-2 hover:text-accent-hover hover:decoration-2 focus-visible:ring-3 focus-visible:ring-accent/35",
	},
	muted: {
		disabled: "cursor-not-allowed text-border no-underline",
		enabled:
			"text-text-muted no-underline hover:text-text hover:underline hover:decoration-1 hover:underline-offset-2 focus-visible:ring-3 focus-visible:ring-accent/35",
	},
	standalone: {
		disabled:
			"inline-flex cursor-not-allowed items-center gap-2 text-border no-underline",
		enabled:
			"inline-flex items-center gap-2 text-accent no-underline hover:text-accent-hover focus-visible:ring-3 focus-visible:ring-accent/35",
	},
};

const Link = ({
	children,
	isDisabled = false,
	to,
	variant = "inline",
}: Properties) => {
	const state = isDisabled ? "disabled" : "enabled";
	const className = `${BASE_CLASS_NAME} ${CLASS_NAMES_BY_VARIANT[variant][state]}`;

	const content = (
		<>
			{children}
			{variant === "standalone" && <span aria-hidden="true">→</span>}
		</>
	);

	if (isDisabled) {
		return (
			<span aria-disabled="true" className={className} role="link">
				{content}
			</span>
		);
	}

	return (
		<RouterLink className={className} to={to}>
			{content}
		</RouterLink>
	);
};

export { Link };
