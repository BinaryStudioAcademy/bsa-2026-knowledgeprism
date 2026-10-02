import {
	type ExtractionContentBlock,
	ExtractionHeadingLevel,
} from "@knowledgeprism/types";

import { toPlainText } from "~/modules/knowledge-extraction/libs/helpers/map-extraction-output.helper.js";
import { type KnowledgeItem } from "~/modules/knowledge-extraction/libs/types/knowledge-item.type.js";

import { SectionAssembly } from "../constants/document-structure.constant.js";

type SectionGroup = {
	blocks: ExtractionContentBlock[];
	isSection: boolean;
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
const SENTENCE_SEGMENTER = new Intl.Segmenter("en", {
	granularity: "sentence",
});
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

const readBlockText = (block: ExtractionContentBlock): string => {
	return block.content.map(({ text }) => text).join("");
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

const toGroupKey = (item: KnowledgeItem): string => {
	return item.sectionIndex === undefined || item.sectionIndex === null
		? `heading:${normalizeText(item.heading)}`
		: `section:${String(item.sectionIndex)}`;
};

const groupItems = (items: KnowledgeItem[]): SectionGroup[] => {
	const groups = new Map<string, SectionGroup>();

	for (const item of items) {
		const key = toGroupKey(item);
		const group = groups.get(key);

		if (group) {
			group.items.push(item);
			continue;
		}

		groups.set(key, {
			blocks: [],
			isSection: item.sectionIndex !== undefined && item.sectionIndex !== null,
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

const isNewText = (text: string, seenTexts: Set<string>): boolean => {
	const normalized = normalizeText(text);

	if (normalized.length < SectionAssembly.MINIMUM_DUPLICATE_LENGTH) {
		return true;
	}

	if (seenTexts.has(normalized)) {
		return false;
	}

	seenTexts.add(normalized);

	return true;
};

const isPlainBlock = (block: ExtractionContentBlock): boolean => {
	return block.content.every(({ styles }) => styles === undefined);
};

const removeDuplicateSentences = (
	block: ExtractionContentBlock,
	seenTexts: Set<string>,
): ExtractionContentBlock[] => {
	const sentences = Array.from(
		SENTENCE_SEGMENTER.segment(readBlockText(block)),
		({ segment }) => segment,
	);
	const kept = sentences.filter((sentence) => isNewText(sentence, seenTexts));

	if (kept.length === sentences.length) {
		return [block];
	}

	const text = kept.join("").trim();

	return text === ""
		? []
		: [{ ...block, content: [{ text, type: TEXT_RUN_TYPE }] }];
};

const removeDuplicateBlocks = (
	blocks: ExtractionContentBlock[],
	seenTexts: Set<string>,
): ExtractionContentBlock[] => {
	return blocks.flatMap((block) => {
		if (isHeadingBlock(block)) {
			return [block];
		}

		if (isPlainBlock(block)) {
			return removeDuplicateSentences(block, seenTexts);
		}

		return isNewText(readBlockText(block), seenTexts) ? [block] : [];
	});
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

const mergeSameTitles = (groups: SectionGroup[]): SectionGroup[] => {
	const byTitle = new Map<string, SectionGroup>();

	for (const group of groups) {
		const key = normalizeText(group.title);
		const existing = byTitle.get(key);

		if (existing) {
			existing.blocks.push(...group.blocks);
			existing.items.push(...group.items);
			continue;
		}

		byTitle.set(key, group);
	}

	return byTitle.values().toArray();
};

const foldShortGroups = (groups: SectionGroup[]): SectionGroup[] => {
	const folded: SectionGroup[] = [];

	for (const group of groups) {
		const previous = folded.at(-NEXT_INDEX_OFFSET);
		const canFold =
			!group.isSection &&
			toPlainText(group.blocks).length < SectionAssembly.MINIMUM_SECTION_LENGTH;

		if (previous && canFold) {
			previous.blocks.push(
				toHeadingBlock(group.title, ExtractionHeadingLevel.NESTED),
				...group.blocks,
			);
			previous.items.push(...group.items);
			continue;
		}

		folded.push(group);
	}

	return folded;
};

const toSectionItem = (
	group: SectionGroup,
	position: number,
): KnowledgeItem | null => {
	const [first] = group.items;
	const bodyBlocks = removeEmptyHeadings(group.blocks);

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
	const seenTexts = new Set<string>();
	const groups = groupItems(items).map((group) => ({
		...group,
		blocks: removeDuplicateBlocks(toGroupBlocks(group), seenTexts),
	}));

	return foldShortGroups(mergeSameTitles(groups))
		.map((group, index) => toSectionItem(group, index + FIRST_POSITION))
		.filter((item): item is KnowledgeItem => item !== null);
};

export { assembleSections };
