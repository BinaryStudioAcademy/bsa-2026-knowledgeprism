import { type IntegrationChangesApplyRequestDto } from "@knowledgeprism/types";

import { type ProposedSection } from "../types/types.js";

const MINIMUM_PUBLISHED_ITEM_ID = 1;
const PUBLISHED_BLOCK_TYPE = "paragraph";
const PUBLISHED_TEXT_TYPE = "text";

const toPublishedItems = (
	pages: ProposedSection[],
): IntegrationChangesApplyRequestDto["items"] => {
	return pages.flatMap((section) =>
		section.pages.flatMap((page) => {
			const id = Number(page.id);

			if (!Number.isSafeInteger(id) || id < MINIMUM_PUBLISHED_ITEM_ID) {
				return [];
			}

			return [
				{
					blocks: [
						{
							content: [{ text: page.content, type: PUBLISHED_TEXT_TYPE }],
							type: PUBLISHED_BLOCK_TYPE,
						},
					],
					id,
					text: page.content,
					title: page.title,
				},
			];
		}),
	);
};

export { toPublishedItems };
