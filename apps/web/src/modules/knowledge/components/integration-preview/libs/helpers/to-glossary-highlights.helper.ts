import { type GlossaryConsistencyMatchDto } from "@knowledgeprism/types";

import { TextHighlightVariant } from "~/components/knowledge-editor/libs/enums/enums.js";
import { type TextHighlight } from "~/components/knowledge-editor/libs/types/types.js";

const toGlossaryHighlightId = (match: GlossaryConsistencyMatchDto): string =>
	`${match.matchedTermId.toString()}:${match.sourceExcerpt}`;

// Maps glossary consistency matches to inline text highlights for KnowledgeEditor. The id
// is looked up against `glossaryMatches` when the tooltip's Accept/Keep/Edit buttons fire.
const toGlossaryHighlights = (
	matches: readonly GlossaryConsistencyMatchDto[],
): TextHighlight[] =>
	matches.map((match) => ({
		id: toGlossaryHighlightId(match),
		text: match.sourceExcerpt,
		variant: TextHighlightVariant.SUGGESTION,
	}));

export { toGlossaryHighlightId, toGlossaryHighlights };
