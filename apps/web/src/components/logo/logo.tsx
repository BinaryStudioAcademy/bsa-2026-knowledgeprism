import { type JSX } from "react";
import { type VariantProps, tv } from "tailwind-variants";

import { Link } from "~/components/link/link.js";
import { AppRoute } from "~/lib/enums/enums.js";
import { type ValueOf } from "~/lib/types/types.js";

const logoStyles = tv({
	slots: {
		container: "inline-flex items-center no-underline",
		facetHighlight: "",
		facetLeft: "",
		facetRight: "",
		icon: "",
		prismText: "",
		text: "font-serif leading-none",
	},
	variants: {
		size: {
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
		},
		variant: {
			default: {
				facetHighlight: "fill-[rgb(58,139,116)]",
				facetLeft: "fill-[rgb(30,80,68)]",
				facetRight: "fill-[rgb(42,107,90)]",
				prismText: "text-accent",
				text: "text-text",
			},
			inverted: {
				facetHighlight: "fill-[rgba(255,255,255,0.85)]",
				facetLeft: "fill-[rgba(255,255,255,0.55)]",
				facetRight: "fill-[#ffffff]",
				prismText: "text-white",
				text: "text-white",
			},
		},
	},
	defaultVariants: {
		size: "md",
		variant: "default",
	},
});

type LogoVariants = VariantProps<typeof logoStyles>;

type IconProperties = LogoVariants;

type Properties = LogoVariants & {
	className?: string;
	hasText?: boolean;
	to?: ValueOf<typeof AppRoute>;
};

const PrismIcon = ({ size, variant }: IconProperties): JSX.Element => {
	const { facetHighlight, facetLeft, facetRight, icon } = logoStyles({
		size,
		variant,
	});

	return (
		<svg aria-hidden="true" className={icon()} viewBox="0 0 44 44">
			<polygon className={facetLeft()} points="22,4 22,40 4,40" />
			<polygon className={facetRight()} points="22,4 40,40 22,40" />
			<polygon className={facetHighlight()} points="22,4 22,22 4,40" />
		</svg>
	);
};

const Logo = ({
	className,
	hasText = true,
	size,
	to,
	variant,
}: Properties): JSX.Element => {
	const { container, prismText, text } = logoStyles({
		size,
		variant,
	});

	const content = (
		<span className={container({ className })}>
			<PrismIcon size={size} variant={variant} />

			{hasText && (
				<span className={text()}>
					Knowledge
					<span className={prismText()}>Prism</span>
				</span>
			)}
		</span>
	);

	if (to) {
		return <Link to={to}>{content}</Link>;
	}

	return content;
};

export { Logo };
