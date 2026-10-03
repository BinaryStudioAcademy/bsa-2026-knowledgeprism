import { parseRawValue } from "~/modules/knowledge-extraction/libs/helpers/map-extraction-output.helper.js";

import { type SectionOutline } from "../types/section-outline.type.js";

const FIRST_INDEX = 0;

const isRecord = (value: unknown): value is Record<string, unknown> => {
	return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isIndexBelow = (value: unknown, limit: number): value is number => {
	return (
		typeof value === "number" &&
		Number.isSafeInteger(value) &&
		value >= FIRST_INDEX &&
		value < limit
	);
};

const toSectionOutline = (
	entry: unknown,
	{ position, treeSize }: { position: number; treeSize: number },
): null | SectionOutline => {
	if (!isRecord(entry) || entry["index"] !== position) {
		return null;
	}

	const { parentIndex = null, parentPriorIndex = null, siblingOrder } = entry;
	const isParentIndexValid =
		parentIndex === null || isIndexBelow(parentIndex, treeSize);
	const isParentPriorIndexValid =
		parentPriorIndex === null || isIndexBelow(parentPriorIndex, position);
	const isSiblingOrderValid = isIndexBelow(
		siblingOrder,
		Number.MAX_SAFE_INTEGER,
	);

	if (
		!isParentIndexValid ||
		!isParentPriorIndexValid ||
		!isSiblingOrderValid ||
		(parentIndex !== null && parentPriorIndex !== null)
	) {
		return null;
	}

	return {
		parentIndex,
		parentPriorIndex,
		proposesParent: true,
		siblingOrder,
	};
};

const mapOutlineOutput = (
	raw: unknown,
	{ sectionCount, treeSize }: { sectionCount: number; treeSize: number },
): null | SectionOutline[] => {
	const parsed = parseRawValue(raw);
	const placements = isRecord(parsed) ? parsed["placements"] : null;

	if (!Array.isArray(placements) || placements.length !== sectionCount) {
		return null;
	}

	const outlines = placements.map((entry: unknown, position) =>
		toSectionOutline(entry, { position, treeSize }),
	);

	return outlines.every((outline) => outline !== null) ? outlines : null;
};

export { mapOutlineOutput };
