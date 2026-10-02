import { type JSX, type ReactNode } from "react";

import { getValidClassNames } from "~/lib/helpers/helpers.js";
import { type ValueOf } from "~/lib/types/types.js";

import { StatusChipTone } from "../../constants.js";

type Properties = {
	children: ReactNode;
	icon: ReactNode;
	title?: string;
	tone: ValueOf<typeof StatusChipTone>;
};

const StatusChip = ({
	children,
	icon,
	title,
	tone,
}: Properties): JSX.Element => (
	<span
		className={getValidClassNames(
			"inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm whitespace-nowrap",
			{
				"bg-error-bg font-medium text-error-hover":
					tone === StatusChipTone.ERROR,
				"bg-secondary text-text": tone === StatusChipTone.NEUTRAL,
				"bg-success-bg text-accent": tone === StatusChipTone.SUCCESS,
			},
		)}
		title={title}
	>
		<span aria-hidden="true" className="flex shrink-0">
			{icon}
		</span>
		{children}
	</span>
);

export { StatusChip };
