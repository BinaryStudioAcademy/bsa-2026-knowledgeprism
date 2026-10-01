import {
	type ExtractionContentBlock,
	type IntegrationChangesApplyRequestDto,
} from "@knowledgeprism/types";

import { type ProposedPage, type ProposedSection } from "../types/types.js";
import { toExtractionContentBlocks } from "./extraction-review.helper.js";

const EMPTY_LENGTH = 0;
const MINIMUM_PUBLISHED_ITEM_ID = 1;
const PARAGRAPH_BREAK = /\n\s*\n/u;
const PUBLISHED_BLOCK_TYPE = "paragraph";
const PUBLISHED_TEXT_TYPE = "text";

const toParagraphBlocks = (
	content: string,
	title: string,
): ExtractionContentBlock[] => {
	const paragraphs = content
		.split(PARAGRAPH_BREAK)
		.map((paragraph) => paragraph.trim())
		.filter((paragraph) => paragraph !== "");
	const [first, ...rest] = paragraphs;
	const body = first === title.trim() ? rest : paragraphs;

	return body.map((paragraph) => ({
		content: [{ text: paragraph, type: PUBLISHED_TEXT_TYPE }],
		type: PUBLISHED_BLOCK_TYPE,
	}));
};

const toPublishedBlocks = (page: ProposedPage): ExtractionContentBlock[] => {
	const blocks = page.blocks ? toExtractionContentBlocks(page.blocks) : [];

	return blocks.length > EMPTY_LENGTH
		? blocks
		: toParagraphBlocks(page.content, page.title);
};

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
					blocks: toPublishedBlocks(page),
					id,
					text: page.content,
					title: page.title,
				},
			];
		}),
	);
};

export { toPublishedItems };
