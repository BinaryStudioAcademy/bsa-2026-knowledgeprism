import { type JSX, type ReactNode } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const ParagraphSize = {
	BODY: "body",
	BODY_SMALL: "body-small",
} as const;

const paragraphStyles = tv({
	base: "font-sans",
	variants: {
		size: {
			[ParagraphSize.BODY]: "text-body leading-[1.6]",
			[ParagraphSize.BODY_SMALL]: "text-sm leading-[1.55] text-text-muted",
		},
	},
	defaultVariants: {
		size: ParagraphSize.BODY,
	},
});

type Properties = VariantProps<typeof paragraphStyles> & {
	children: ReactNode;
	className?: string;
};

const Paragraph = ({ children, className, size }: Properties): JSX.Element => (
	<p className={paragraphStyles({ className, size })}>{children}</p>
);

export { Paragraph, ParagraphSize };
