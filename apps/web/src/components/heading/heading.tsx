import { type JSX, type ReactNode } from "react";
import { tv } from "tailwind-variants";

const headingStyles = tv({
	variants: {
		level: {
			1: "font-serif text-h1 leading-[1.15] tracking-[-0.3px]",
			2: "font-serif text-h2 leading-[1.2]",
			3: "font-serif text-h3 leading-[1.3]",
			4: "font-sans text-h4 font-medium",
			5: "font-sans text-body font-medium",
			6: "font-sans text-sm font-medium uppercase tracking-[.06em] text-text-muted",
		},
	},
});

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

const levelToTag: Record<HeadingLevel, HeadingTag> = {
	1: "h1",
	2: "h2",
	3: "h3",
	4: "h4",
	5: "h5",
	6: "h6",
};

type Properties = {
	children: ReactNode;
	className?: string;
	level: HeadingLevel;
};

const Heading = ({ children, className, level }: Properties): JSX.Element => {
	const Tag = levelToTag[level];

	return <Tag className={headingStyles({ className, level })}>{children}</Tag>;
};

export { Heading };
