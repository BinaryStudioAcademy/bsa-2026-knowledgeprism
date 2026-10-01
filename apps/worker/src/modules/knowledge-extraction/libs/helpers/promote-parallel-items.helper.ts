import {
	type ExtractionContentBlock,
	ExtractionHeadingLevel,
} from "@knowledgeprism/types";

const INDEX_STEP = 1;
const TEXT_START = 0;
const MIN_PARALLEL_COUNT = 2;
const NAME_MAXIMUM_LENGTH = 80;
const NAME_MINIMUM_LENGTH = 2;
const NEXT_BLOCK_OFFSET = 1;
const PAIR_STEP = 2;
const SINGLE_RUN_COUNT = 1;

const BulletListType = "bulletListItem";
const NumberedListType = "numberedListItem";
const ParagraphType = "paragraph";

const BULLET_PREFIX_PATTERN = /^(?:[\u{2022}\u{25AA}\u{25CF}*-])\s+/u;
const EM_DASH_SEPARATOR = " \u{2014} ";
const EN_DASH_SEPARATOR = " \u{2013} ";
const HYPHEN_SEPARATOR = " - ";
const LEAD_SEPARATORS = [
	EM_DASH_SEPARATOR,
	EN_DASH_SEPARATOR,
	HYPHEN_SEPARATOR,
] as const;
const NUMBERED_PREFIX_PATTERN = /^\d+[.)]\s+/u;
const SENTENCE_ENDING_PATTERN = /[.!?]$/u;

type ConsumedBlocks = {
	blocks: ExtractionContentBlock[];
	nextIndex: number;
};

type LeadParts = {
	explanation: string;
	name: string;
	wasSplit: boolean;
};

type ParallelItem = {
	explanations: string[];
	name: string;
};

type ParallelListType = typeof BulletListType | typeof NumberedListType;

const readText = (block: ExtractionContentBlock): string => {
	return block.content
		.map((run) => run.text)
		.join("")
		.trim();
};

const isShortName = (text: string): boolean => {
	return (
		text.length >= NAME_MINIMUM_LENGTH &&
		text.length <= NAME_MAXIMUM_LENGTH &&
		!SENTENCE_ENDING_PATTERN.test(text)
	);
};

const isPlainParagraph = (block: ExtractionContentBlock): boolean => {
	return (
		block.type === ParagraphType && block.props?.backgroundColor === undefined
	);
};

const readMarkedBody = (text: string, pattern: RegExp): null | string => {
	const match = pattern.exec(text);

	if (!match) {
		return null;
	}

	const [prefix] = match;

	if (!prefix) {
		return null;
	}

	const body = text.slice(prefix.length).trim();

	return body === "" ? null : body;
};

const countNumberedMarkers = (sourceExcerpt: string): number => {
	let count = 0;

	for (const line of sourceExcerpt.split(/\r?\n/u)) {
		if (readMarkedBody(line.trim(), NUMBERED_PREFIX_PATTERN)) {
			count += INDEX_STEP;
		}
	}

	return count;
};

const listKindFromExcerpt = (sourceExcerpt: string): ParallelListType => {
	return countNumberedMarkers(sourceExcerpt) >= MIN_PARALLEL_COUNT
		? NumberedListType
		: BulletListType;
};

const splitLead = (name: string): LeadParts => {
	for (const separator of LEAD_SEPARATORS) {
		const index = name.indexOf(separator);

		if (index < NAME_MINIMUM_LENGTH) {
			continue;
		}

		const rawName = name.slice(TEXT_START, index).trim();
		const rest = name.slice(index + separator.length).trim();

		if (rest !== "" && isShortName(rawName)) {
			return {
				explanation: `${separator.trim()} ${rest}`,
				name: rawName,
				wasSplit: true,
			};
		}
	}

	return { explanation: "", name: name.trim(), wasSplit: false };
};

const toListItem = (
	item: ParallelItem,
	listType: ParallelListType,
): ExtractionContentBlock => {
	const lead = splitLead(item.name);
	const explanation = [lead.explanation, ...item.explanations]
		.map((part) => part.trim())
		.filter((part) => part !== "")
		.join(" ");
	const shouldBold = lead.wasSplit || isShortName(lead.name);

	if (!shouldBold) {
		const text = [lead.name, explanation]
			.filter((part) => part !== "")
			.join(" ");

		return { content: [{ text, type: "text" }], type: listType };
	}

	if (explanation === "") {
		return {
			content: [{ styles: { bold: true }, text: lead.name, type: "text" }],
			type: listType,
		};
	}

	return {
		content: [
			{ styles: { bold: true }, text: lead.name, type: "text" },
			{ text: ` ${explanation}`, type: "text" },
		],
		type: listType,
	};
};

const plainParagraphEnd = (
	blocks: ExtractionContentBlock[],
	start: number,
): number => {
	let index = start;

	while (index < blocks.length) {
		const block = blocks[index];

		if (!block || !isPlainParagraph(block)) {
			break;
		}

		index += INDEX_STEP;
	}

	return index;
};

const splitMarkedRun = (
	blocks: ExtractionContentBlock[],
	pattern: RegExp,
): null | ParallelItem[] => {
	const items: ParallelItem[] = [];
	let current: null | ParallelItem = null;

	for (const block of blocks) {
		const text = readText(block);
		const body = readMarkedBody(text, pattern);

		if (body) {
			if (current) {
				items.push(current);
			}

			current = { explanations: [], name: body };
			continue;
		}

		if (!current) {
			return null;
		}

		if (text !== "") {
			current.explanations.push(text);
		}
	}

	if (current) {
		items.push(current);
	}

	return items.length >= MIN_PARALLEL_COUNT ? items : null;
};

const takeMarkedParagraphRun = (
	blocks: ExtractionContentBlock[],
	start: number,
	marked: { listType: ParallelListType; pattern: RegExp },
): ConsumedBlocks | null => {
	const first = blocks[start];

	if (
		!first ||
		!isPlainParagraph(first) ||
		!readMarkedBody(readText(first), marked.pattern)
	) {
		return null;
	}

	const nextIndex = plainParagraphEnd(blocks, start);
	const items = splitMarkedRun(blocks.slice(start, nextIndex), marked.pattern);

	if (!items) {
		return null;
	}

	return {
		blocks: items.map((item) => toListItem(item, marked.listType)),
		nextIndex,
	};
};

const takeLeadInRun = (
	blocks: ExtractionContentBlock[],
	start: number,
	sourceExcerpt: string,
): ConsumedBlocks | null => {
	const matched: ExtractionContentBlock[] = [];
	let index = start;

	while (index < blocks.length) {
		const block = blocks[index];

		if (
			!block ||
			!isPlainParagraph(block) ||
			!splitLead(readText(block)).wasSplit
		) {
			break;
		}

		matched.push(block);
		index += INDEX_STEP;
	}

	if (matched.length < MIN_PARALLEL_COUNT) {
		return null;
	}

	const listType = listKindFromExcerpt(sourceExcerpt);

	return {
		blocks: matched.map((block) => {
			return toListItem({ explanations: [], name: readText(block) }, listType);
		}),
		nextIndex: index,
	};
};

const takeSplitListItems = (
	blocks: ExtractionContentBlock[],
	start: number,
): ConsumedBlocks | null => {
	const first = blocks[start];

	if (
		!first ||
		(first.type !== NumberedListType && first.type !== BulletListType)
	) {
		return null;
	}

	const listType = first.type;
	const items: ParallelItem[] = [];
	let index = start;

	while (index < blocks.length) {
		const item = blocks[index];
		const body = blocks[index + NEXT_BLOCK_OFFSET];

		if (!item || !body || item.type !== listType || !isPlainParagraph(body)) {
			break;
		}

		const name = readText(item);

		if (!isShortName(name)) {
			break;
		}

		items.push({ explanations: [readText(body)], name });
		index += PAIR_STEP;
	}

	if (items.length < MIN_PARALLEL_COUNT) {
		return null;
	}

	return {
		blocks: items.map((item) => toListItem(item, listType)),
		nextIndex: index,
	};
};

const readPairName = (block: ExtractionContentBlock): null | string => {
	const text = readText(block);

	if (!isShortName(text)) {
		return null;
	}

	if (
		block.type === "heading" &&
		block.props?.level === ExtractionHeadingLevel.NESTED
	) {
		return text;
	}

	if (!isPlainParagraph(block)) {
		return null;
	}

	if (
		readMarkedBody(text, NUMBERED_PREFIX_PATTERN) ||
		readMarkedBody(text, BULLET_PREFIX_PATTERN) ||
		splitLead(text).wasSplit
	) {
		return null;
	}

	return text;
};

const takeNamePairs = (
	blocks: ExtractionContentBlock[],
	start: number,
	sourceExcerpt: string,
): ConsumedBlocks | null => {
	const items: ParallelItem[] = [];
	let index = start;

	while (index < blocks.length) {
		const nameBlock = blocks[index];
		const bodyBlock = blocks[index + NEXT_BLOCK_OFFSET];

		if (!nameBlock || !bodyBlock || !isPlainParagraph(bodyBlock)) {
			break;
		}

		const name = readPairName(nameBlock);
		const explanation = readText(bodyBlock);

		if (!name || explanation === "") {
			break;
		}

		items.push({ explanations: [explanation], name });
		index += PAIR_STEP;
	}

	if (items.length < MIN_PARALLEL_COUNT) {
		return null;
	}

	const listType = listKindFromExcerpt(sourceExcerpt);

	return {
		blocks: items.map((item) => toListItem(item, listType)),
		nextIndex: index,
	};
};

const emphasizeListLeadIn = (
	block: ExtractionContentBlock,
): ExtractionContentBlock => {
	if (block.type !== BulletListType && block.type !== NumberedListType) {
		return block;
	}

	if (block.content.some((run) => run.styles?.bold === true)) {
		return block;
	}

	if (block.content.length !== SINGLE_RUN_COUNT) {
		return block;
	}

	const text = readText(block);
	const lead = splitLead(text);

	if (!lead.wasSplit) {
		return block;
	}

	return toListItem({ explanations: [], name: text }, block.type);
};

const groupFlattenedParallelItems = (
	blocks: ExtractionContentBlock[],
	sourceExcerpt: string,
): ExtractionContentBlock[] => {
	const grouped: ExtractionContentBlock[] = [];
	let index = 0;

	while (index < blocks.length) {
		const consumed =
			takeMarkedParagraphRun(blocks, index, {
				listType: NumberedListType,
				pattern: NUMBERED_PREFIX_PATTERN,
			}) ??
			takeMarkedParagraphRun(blocks, index, {
				listType: BulletListType,
				pattern: BULLET_PREFIX_PATTERN,
			}) ??
			takeLeadInRun(blocks, index, sourceExcerpt) ??
			takeSplitListItems(blocks, index) ??
			takeNamePairs(blocks, index, sourceExcerpt);

		if (consumed) {
			grouped.push(...consumed.blocks);
			index = consumed.nextIndex;
			continue;
		}

		const block = blocks[index];

		if (block) {
			grouped.push(block);
		}

		index += INDEX_STEP;
	}

	return grouped;
};

const promoteParallelItems = (
	blocks: ExtractionContentBlock[],
	sourceExcerpt: string,
): ExtractionContentBlock[] => {
	return groupFlattenedParallelItems(blocks, sourceExcerpt).map((block) => {
		return emphasizeListLeadIn(block);
	});
};

export { promoteParallelItems };
