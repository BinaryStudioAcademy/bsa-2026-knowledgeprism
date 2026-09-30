import { type GlossaryConsistencyMatchDto } from "@knowledgeprism/types";

import { type TextHighlightVariant } from "~/components/knowledge-editor/libs/enums/enums.js";
import { type TextHighlight } from "~/components/knowledge-editor/libs/types/types.js";
import { type ValueOf } from "~/lib/types/types.js";

const toGlossaryHighlightId = (match: GlossaryConsistencyMatchDto): string =>
	`${match.matchedTermId.toString()}:${match.sourceExcerpt}`;

const toGlossaryHighlights = (
	matches: readonly GlossaryConsistencyMatchDto[],
	variant: ValueOf<typeof TextHighlightVariant>,
): TextHighlight[] =>
	matches.map((match) => ({
		id: toGlossaryHighlightId(match),
		text: match.sourceExcerpt,
		variant,
	}));

export { toGlossaryHighlightId, toGlossaryHighlights };
