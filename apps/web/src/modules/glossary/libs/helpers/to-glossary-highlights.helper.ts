import { type GlossaryConsistencyMatchDto } from "@knowledgeprism/types";

import { type TextHighlightVariant } from "~/components/knowledge-editor/libs/enums/enums.js";
import { type TextHighlight } from "~/components/knowledge-editor/libs/types/types.js";
import { type ValueOf } from "~/lib/types/types.js";

const toGlossaryHighlightId = (match: GlossaryConsistencyMatchDto): string =>
	`${match.matchedTermId.toString()}:${match.sourceExcerpt}`;

// Maps glossary consistency matches to inline text highlights for KnowledgeEditor. The id
// is looked up against the matches when a highlight's tooltip or panel row fires an action.
// `variant` is explicit rather than defaulted: Integration Preview highlights are
// suggestions on proposed content, the KB editor's are live warnings, and picking the wrong
// one silently would just look like a styling bug.
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
