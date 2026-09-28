import { type IntegrationChangeContentOverrideDto } from "@knowledgeprism/types";

import { type ProposedSection } from "../types/types.js";

// The reviewer may have edited a page's content/title in Integration Preview (typing directly,
// or accepting a glossary suggestion) before approving — send the current local state for every
// entry so the backend writes what's on screen instead of the original, unedited extraction.
const toContentOverrides = (
	sections: ProposedSection[],
): IntegrationChangeContentOverrideDto[] =>
	sections
		.flatMap((section) => section.pages)
		.map((page) => ({
			changeId: page.integrationChangeId,
			content: page.content,
			title: page.title,
		}));

export { toContentOverrides };
