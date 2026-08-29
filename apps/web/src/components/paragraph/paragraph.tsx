import { ParagraphSize } from "~/lib/enums/enums.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";
import { type ValueOf } from "~/lib/types/types.js";

type ParagraphSizeValue = ValueOf<typeof ParagraphSize>;

type Properties = {
	children: React.ReactNode;
	className?: string;
	size?: ParagraphSizeValue;
};

const sizeClassName: Record<ParagraphSizeValue, string> = {
	[ParagraphSize.BODY]: "font-sans text-body leading-[1.6]",
	[ParagraphSize.BODY_SMALL]:
		"font-sans text-sm leading-[1.55] text-text-muted",
};

const Paragraph: React.FC<Properties> = ({
	children,
	className,
	size = ParagraphSize.BODY,
}: Properties) => (
	<p className={getValidClassNames(sizeClassName[size], className)}>
		{children}
	</p>
);

export { Paragraph };
