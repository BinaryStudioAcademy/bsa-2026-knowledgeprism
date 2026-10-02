import {
	type ExtractionContentBlock,
	ExtractionHeadingLevel,
} from "@knowledgeprism/types";

import { toPlainText } from "~/modules/knowledge-extraction/libs/helpers/map-extraction-output.helper.js";
import { type KnowledgeItem } from "~/modules/knowledge-extraction/libs/types/knowledge-item.type.js";

type SectionGroup = {
	items: KnowledgeItem[];
	title: string;
};

const FIRST_INDEX = 0;
const FIRST_POSITION = 1;
const HEADING_BLOCK_TYPE = "heading";
const NEXT_INDEX_OFFSET = 1;
const NON_WORD_CHARACTERS = /[^\p{L}\p{N}]+/gu;
const SECTION_NUMBER_PREFIXES = [
	/^\d+(?:\.\d+)*\.?\s+/u,
	/^section \d+:?\s+/iu,
	/^appendix [a-z\d]+\.?\s+/iu,
	/^[a-z]{1,4}-\d+\s+/iu,
];
const TEXT_RUN_TYPE = "text";

const normalizeText = (text: string): string => {
	return text.toLowerCase().replaceAll(NON_WORD_CHARACTERS, " ").trim();
};

const toComparableTitle = (title: string): string => {
	const trimmed = title.trim();
	const prefix = SECTION_NUMBER_PREFIXES.find((pattern) =>
		pattern.test(trimmed),
	);

	return normalizeText(prefix ? trimmed.replace(prefix, "") : trimmed);
};

const isSameTitle = (left: string, right: string): boolean => {
	return (
		normalizeText(left) === normalizeText(right) ||
		toComparableTitle(left) === toComparableTitle(right)
	);
};

const isHeadingBlock = (block: ExtractionContentBlock): boolean => {
	return block.type === HEADING_BLOCK_TYPE;
};

const toHeadingBlock = (
	text: string,
	level: (typeof ExtractionHeadingLevel)[keyof typeof ExtractionHeadingLevel],
): ExtractionContentBlock => {
	return {
		content: [{ text, type: TEXT_RUN_TYPE }],
		props: { level },
		type: HEADING_BLOCK_TYPE,
	};
};

const toBodyBlocks = (item: KnowledgeItem): ExtractionContentBlock[] => {
	const [first, ...rest] = item.blocks;

	return first && isHeadingBlock(first) ? rest : item.blocks;
};

const toGroupKey = (item: KnowledgeItem, index: number): string => {
	return item.sectionIndex === undefined || item.sectionIndex === null
		? `item:${String(index)}`
		: `section:${String(item.sectionIndex)}`;
};

const groupItems = (items: KnowledgeItem[]): SectionGroup[] => {
	const groups = new Map<string, SectionGroup>();

	for (const [index, item] of items.entries()) {
		const key = toGroupKey(item, index);
		const group = groups.get(key);

		if (group) {
			group.items.push(item);
			continue;
		}

		groups.set(key, {
			items: [item],
			title: item.sectionTitle ?? item.heading,
		});
	}

	return groups.values().toArray();
};

const toGroupBlocks = (group: SectionGroup): ExtractionContentBlock[] => {
	return group.items.flatMap((item) =>
		isSameTitle(item.heading, group.title)
			? toBodyBlocks(item)
			: [
					toHeadingBlock(item.heading, ExtractionHeadingLevel.NESTED),
					...toBodyBlocks(item),
				],
	);
};

const removeEmptyHeadings = (
	blocks: ExtractionContentBlock[],
): ExtractionContentBlock[] => {
	return blocks.filter((block, index) => {
		const next = blocks[index + NEXT_INDEX_OFFSET];

		return (
			!isHeadingBlock(block) || (next !== undefined && !isHeadingBlock(next))
		);
	});
};

const toSectionItem = (
	group: SectionGroup,
	position: number,
): KnowledgeItem | null => {
	const [first] = group.items;
	const bodyBlocks = removeEmptyHeadings(toGroupBlocks(group));

	if (!first || bodyBlocks.length === FIRST_INDEX) {
		return null;
	}

	const blocks = [
		toHeadingBlock(group.title, ExtractionHeadingLevel.SECTION),
		...bodyBlocks,
	];

	return {
		blocks,
		confidence: Math.min(...group.items.map(({ confidence }) => confidence)),
		heading: group.title,
		position,
		rationale: first.rationale,
		sectionIndex: first.sectionIndex ?? null,
		sourceExcerpt: first.sourceExcerpt,
		sourcePageNumber: Math.min(
			...group.items.map(({ sourcePageNumber }) => sourcePageNumber),
		),
		text: toPlainText(blocks),
		title: group.title,
	};
};

const assembleSections = (items: KnowledgeItem[]): KnowledgeItem[] => {
	return groupItems(items)
		.map((group, index) => toSectionItem(group, index + FIRST_POSITION))
		.filter((item): item is KnowledgeItem => item !== null);
};

export { assembleSections };
