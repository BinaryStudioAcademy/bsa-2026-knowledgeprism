import { type ExtractionContentBlock } from "@knowledgeprism/types";

import { type KnowledgeItem } from "~/modules/knowledge-extraction/libs/types/knowledge-item.type.js";

const REPEATED_FACT = "Passwords must have at least 8 characters.";
const CONFIDENCE = 0.9;
const FIRST_POSITION = 1;
const FIRST_SECTION_INDEX = 0;
const SECOND_SECTION_INDEX = 1;
const PAGE_NUMBER = 1;

const toBlocks = (
	heading: string,
	paragraph: string,
): ExtractionContentBlock[] => [
	{
		content: [{ text: heading, type: "text" }],
		props: { level: 2 },
		type: "heading",
	},
	{ content: [{ text: paragraph, type: "text" }], type: "paragraph" },
];

const toItem = (
	heading: string,
	paragraph: string,
	sectionIndex: number,
): KnowledgeItem => ({
	blocks: toBlocks(heading, paragraph),
	confidence: CONFIDENCE,
	heading,
	position: FIRST_POSITION,
	rationale: "Extracted from the source section.",
	sectionIndex,
	sectionTitle: heading,
	sourceExcerpt: paragraph,
	sourcePageNumber: PAGE_NUMBER,
	text: paragraph,
	title: heading,
});

const REPEATED_FACT_ITEMS: KnowledgeItem[] = [
	toItem(
		"Registration",
		`The admin creates the organisation account. ${REPEATED_FACT}`,
		FIRST_SECTION_INDEX,
	),
	toItem(
		"User management",
		`The admin can reset a user's password. ${REPEATED_FACT}`,
		SECOND_SECTION_INDEX,
	),
];

export { REPEATED_FACT, REPEATED_FACT_ITEMS };
