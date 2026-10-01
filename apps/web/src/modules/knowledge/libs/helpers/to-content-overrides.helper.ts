import { type IntegrationChangeContentOverrideDto } from "@knowledgeprism/types";

import { type ProposedSection } from "../types/types.js";

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
