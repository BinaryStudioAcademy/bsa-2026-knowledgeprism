import { type ValueOf } from "~/lib/types/types.js";

import { type TextHighlightVariant } from "../enums/enums.js";

type TextHighlightRange = {
	from: number;
	id: string;
	to: number;
	variant: ValueOf<typeof TextHighlightVariant>;
};

export { type TextHighlightRange };
