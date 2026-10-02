import { type ExtractionItemEntity } from "~/modules/documents/models/extraction-item.entity.js";

const UNSECTIONED_GROUP_KEY = "unsectioned";

const toSectionGroupKey = (item: ExtractionItemEntity): string => {
	const { extractionSectionId } = item.toObject();

	return extractionSectionId === null
		? UNSECTIONED_GROUP_KEY
		: String(extractionSectionId);
};

const groupBySection = (
	items: ExtractionItemEntity[],
): ExtractionItemEntity[][] => {
	const groups = new Map<string, ExtractionItemEntity[]>();

	for (const item of items) {
		const key = toSectionGroupKey(item);
		groups.set(key, [...(groups.get(key) ?? []), item]);
	}

	return groups.values().toArray();
};

export { groupBySection };
