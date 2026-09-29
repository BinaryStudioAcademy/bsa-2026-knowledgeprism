import { type ValueOf } from "~/lib/types/types.js";

import { type TextHighlightVariant } from "../enums/enums.js";

type TextHighlight = {
	id: string;
	text: string;
	variant: ValueOf<typeof TextHighlightVariant>;
};

export { type TextHighlight };
