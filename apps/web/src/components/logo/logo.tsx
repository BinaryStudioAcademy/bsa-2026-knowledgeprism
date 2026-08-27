import { type JSX } from "react";

import { Link } from "~/components/components.js";
import { AppRoute } from "~/lib/enums/enums.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";
import { type ValueOf } from "~/lib/types/types.js";

type IconProperties = {
	size?: Size;
	variant?: Variant;
};

type Properties = {
	className?: string;
	hasText?: boolean;
	size?: Size;
	to?: ValueOf<typeof AppRoute>;
	variant?: Variant;
};

type Size = "lg" | "md" | "sm";

type Variant = "default" | "inverted";

const sizeToStyle = {
	lg: {
		container: "gap-3.5",
		icon: "size-9",
		text: "text-2xl",
	},
	md: {
		container: "gap-2.5",
		icon: "size-6",
		text: "text-xl",
	},
	sm: {
		container: "gap-2",
		icon: "size-5",
		text: "text-base",
	},
} as const;

const variantToFacetColor = {
	default: {
		highlight: "rgb(58, 139, 116)",
		left: "rgb(30, 80, 68)",
		right: "rgb(42, 107, 90)",
	},
	inverted: {
		highlight: "rgba(255, 255, 255, 0.85)",
		left: "rgba(255, 255, 255, 0.55)",
		right: "#ffffff",
	},
} as const;

const PrismIcon = ({
	size = "md",
	variant = "default",
}: IconProperties): JSX.Element => {
	const colors = variantToFacetColor[variant];

	return (
		<svg
			aria-hidden="true"
			className={sizeToStyle[size].icon}
			viewBox="0 0 44 44"
		>
			<polygon fill={colors.left} points="22,4 22,40 4,40" />
			<polygon fill={colors.right} points="22,4 40,40 22,40" />
			<polygon fill={colors.highlight} points="22,4 22,22 4,40" />
		</svg>
	);
};

const Logo = ({
	className,
	hasText = true,
	size = "md",
	to = AppRoute.ROOT,
	variant = "default",
}: Properties): JSX.Element => {
	const isInverted = variant === "inverted";
	const styles = sizeToStyle[size];

	return (
		<Link to={to}>
			<span
				className={getValidClassNames(
					"inline-flex items-center no-underline",
					styles.container,
					className,
				)}
			>
				<PrismIcon size={size} variant={variant} />

				{hasText && (
					<span
						className={getValidClassNames(
							"font-serif leading-none",
							styles.text,
							isInverted ? "text-white" : "text-text",
						)}
					>
						Knowledge
						<span className={isInverted ? "text-white" : "text-accent"}>
							Prism
						</span>
					</span>
				)}
			</span>
		</Link>
	);
};

export { Logo };
