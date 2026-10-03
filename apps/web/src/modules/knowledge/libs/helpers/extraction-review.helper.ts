import { type PartialBlock } from "@blocknote/core";
import { KnowledgeNodeType } from "@knowledgeprism/constants";
import {
	ExtractionBlockBackground,
	type ExtractionBlockBackgroundValue,
	type ExtractionContentBlock,
	ExtractionHeadingLevel,
	type ExtractionItemResponseDto,
	type ExtractionItemsReviewRequestDto,
	type ExtractionSectionResponseDto,
} from "@knowledgeprism/types";

import { type ProposedSection } from "../types/types.js";

const EMPTY_LENGTH = 0;
const EXTRACTION_SECTION_ID_PREFIX = "source-page";
const TEXT_RUN_TYPE = "text";

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

const CALLOUT_BACKGROUNDS = new Set<string>(
	Object.values(ExtractionBlockBackground),
);

const isCalloutBackground = (
	value: string,
): value is ExtractionBlockBackgroundValue => CALLOUT_BACKGROUNDS.has(value);

const SUPPORTED_BLOCK_TYPES = new Set<ExtractionContentBlock["type"]>([
	"bulletListItem",
	"checkListItem",
	"heading",
	"numberedListItem",
	"paragraph",
]);

const isSupportedBlockType = (
	type: string,
): type is ExtractionContentBlock["type"] =>
	SUPPORTED_BLOCK_TYPES.has(type as ExtractionContentBlock["type"]);

const toTextStyle = (
	styles: unknown,
):
	| NonNullable<ExtractionContentBlock["content"][number]["styles"]>
	| undefined => {
	if (!isRecord(styles)) {
		return undefined;
	}

	const nextStyle: NonNullable<
		ExtractionContentBlock["content"][number]["styles"]
	> = {};

	if (styles["bold"] === true) {
		nextStyle.bold = true;
	}

	if (styles["backgroundColor"] === "yellow") {
		nextStyle.backgroundColor = "yellow";
	}

	return nextStyle.bold === true || nextStyle.backgroundColor === "yellow"
		? nextStyle
		: undefined;
};

const toInlineContent = (
	content: unknown,
): ExtractionContentBlock["content"] => {
	if (typeof content === "string") {
		return content.length > EMPTY_LENGTH
			? [{ text: content, type: TEXT_RUN_TYPE }]
			: [];
	}

	if (!Array.isArray(content)) {
		return [];
	}

	return content.flatMap((item) => {
		if (
			!isRecord(item) ||
			item["type"] !== TEXT_RUN_TYPE ||
			typeof item["text"] !== "string"
		) {
			return [];
		}

		const styles = toTextStyle(item["styles"]);

		return [
			{
				...(styles && { styles }),
				text: item["text"],
				type: TEXT_RUN_TYPE,
			},
		];
	});
};

const toBlockProperties = (
	type: ExtractionContentBlock["type"],
	properties: unknown,
): ExtractionContentBlock["props"] | undefined => {
	if (!isRecord(properties)) {
		return undefined;
	}

	const nextProperties: NonNullable<ExtractionContentBlock["props"]> = {};

	if (
		type === "heading" &&
		(properties["level"] === ExtractionHeadingLevel.SECTION ||
			properties["level"] === ExtractionHeadingLevel.NESTED)
	) {
		nextProperties.level = properties["level"];
	}

	if (type === "checkListItem" && typeof properties["checked"] === "boolean") {
		nextProperties.checked = properties["checked"];
	}

	if (
		type === "paragraph" &&
		typeof properties["backgroundColor"] === "string" &&
		isCalloutBackground(properties["backgroundColor"])
	) {
		nextProperties.backgroundColor = properties["backgroundColor"];
	}

	return nextProperties.backgroundColor === undefined &&
		nextProperties.level === undefined &&
		nextProperties.checked === undefined
		? undefined
		: nextProperties;
};

const toExtractionContentBlock = (
	block: PartialBlock,
): ExtractionContentBlock | null => {
	if (!block.type || !isSupportedBlockType(block.type)) {
		return null;
	}

	const content = toInlineContent(block.content);

	if (content.length === EMPTY_LENGTH) {
		return null;
	}

	const properties = toBlockProperties(block.type, block.props);

	return {
		content,
		...(properties && { props: properties }),
		type: block.type,
	};
};

const toExtractionContentBlocks = (
	blocks: readonly PartialBlock[],
): ExtractionContentBlock[] =>
	blocks.flatMap((block) => {
		const converted = toExtractionContentBlock(block);
		const children = Array.isArray(block.children)
			? toExtractionContentBlocks(block.children)
			: [];

		return converted ? [converted, ...children] : children;
	});

const toEditorBlocks = (blocks: ExtractionContentBlock[]): PartialBlock[] => {
	return blocks.map((block) => {
		return {
			content: block.content.map((run) => {
				return {
					styles: run.styles ?? {},
					text: run.text,
					type: "text",
				};
			}),
			...(block.props && { props: block.props }),
			type: block.type,
		};
	});
};

const toProposedPage = (
	item: ExtractionItemResponseDto,
): ProposedSection["pages"][number] => ({
	...(item.blocks && { blocks: toEditorBlocks(item.blocks) }),
	content: item.text,
	id: String(item.id),
	integrationChangeId: item.id,
	sourceExcerpt: item.sourceExcerpt,
	sourcePageNumber: item.sourcePageNumber,
	status: "created",
	title: item.title,
	type: KnowledgeNodeType.PAGE,
});

const sortPagesByItemPosition = (
	pages: ProposedSection["pages"],
	itemPositionById: Map<number, number>,
): ProposedSection["pages"] =>
	pages.toSorted((pageA, pageB) => {
		const positionA = itemPositionById.get(Number(pageA.id)) ?? EMPTY_LENGTH;
		const positionB = itemPositionById.get(Number(pageB.id)) ?? EMPTY_LENGTH;

		return positionA - positionB;
	});

const mapExtractionItemsToProposedStructure = (
	extractionItems: ExtractionItemResponseDto[],
	extractionSections: ExtractionSectionResponseDto[] = [],
): ProposedSection[] => {
	const sectionsById = new Map<
		number,
		{
			pages: ProposedSection["pages"];
			position: number;
			title: string;
		}
	>();

	for (const section of extractionSections) {
		sectionsById.set(section.id, {
			pages: [],
			position: section.position,
			title: section.title,
		});
	}

	const unsectionedItemsByPage = new Map<number, ProposedSection["pages"]>();

	for (const item of extractionItems) {
		const sectionId = item.extractionSectionId;

		if (sectionId === null) {
			const pages = unsectionedItemsByPage.get(item.sourcePageNumber) ?? [];

			pages.push(toProposedPage(item));
			unsectionedItemsByPage.set(item.sourcePageNumber, pages);
			continue;
		}

		const section = sectionsById.get(sectionId) ?? {
			pages: [],
			position: item.sectionPosition ?? item.sourcePageNumber,
			title:
				item.sectionTitle ??
				`Extracted from Page ${String(item.sourcePageNumber)}`,
		};

		section.pages.push(toProposedPage(item));
		sectionsById.set(sectionId, section);
	}

	const itemPositionById = new Map(
		extractionItems.map((item) => [item.id, item.position]),
	);

	const savedSections = [...sectionsById]
		.toSorted(
			([, sectionA], [, sectionB]) => sectionA.position - sectionB.position,
		)
		.map(([sectionId, section]) => ({
			id: String(sectionId),
			pages: sortPagesByItemPosition(section.pages, itemPositionById),
			status: "created" as const,
			title: section.title,
			type: KnowledgeNodeType.SECTION,
		}));

	const unsectionedGroups = [...unsectionedItemsByPage]
		.toSorted(([pageA], [pageB]) => pageA - pageB)
		.map(([pageNumber, pages]) => ({
			id: `${EXTRACTION_SECTION_ID_PREFIX}-${String(pageNumber)}`,
			pages: sortPagesByItemPosition(pages, itemPositionById),
			status: "created" as const,
			title: `Extracted from Page ${String(pageNumber)}`,
			type: KnowledgeNodeType.SECTION,
		}));

	return [...savedSections, ...unsectionedGroups];
};

const parseExtractionItemId = (pageId: string): null | number => {
	const parsed = Number(pageId);

	return Number.isFinite(parsed) ? parsed : null;
};

const collectApprovedExtractionItemIds = (
	pages: ProposedSection[],
): number[] => {
	const ids: number[] = [];

	for (const section of pages) {
		for (const page of section.pages) {
			const id = parseExtractionItemId(page.id);

			if (id !== null) {
				ids.push(id);
			}
		}
	}

	return ids;
};

const deriveExtractionReviewIds = (
	pages: ProposedSection[],
	extractionItems: ExtractionItemResponseDto[],
): { approvedIds: number[]; rejectedIds: number[] } => {
	const approvedIds = collectApprovedExtractionItemIds(pages);
	const allItemIds = extractionItems.map((item) => item.id);
	const rejectedIds = allItemIds.filter((id) => !approvedIds.includes(id));

	return { approvedIds, rejectedIds };
};

const toExtractionReviewPayload = (
	pages: ProposedSection[],
	extractionItems: ExtractionItemResponseDto[],
): ExtractionItemsReviewRequestDto => {
	const { approvedIds, rejectedIds } = deriveExtractionReviewIds(
		pages,
		extractionItems,
	);
	const nonEmptySections = pages.filter(
		(section) => section.pages.length > EMPTY_LENGTH,
	);

	return {
		approvedIds,
		rejectedIds,
		sections: nonEmptySections.map((section) => ({
			items: section.pages.map((page) => {
				const id = parseExtractionItemId(page.id);
				const blocks = page.blocks
					? toExtractionContentBlocks(page.blocks)
					: [];

				return {
					...(blocks.length > EMPTY_LENGTH && { blocks }),
					...(id !== null && { id }),
					text: page.content,
					title: page.title,
				};
			}),
			title: section.title,
		})),
	};
};

export {
	mapExtractionItemsToProposedStructure,
	toEditorBlocks,
	toExtractionContentBlocks,
	toExtractionReviewPayload,
};
