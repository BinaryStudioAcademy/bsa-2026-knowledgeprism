import { type DocumentPlacementDto } from "@knowledgeprism/types";

const FIRST_SIBLING_ORDER = 0;

const isRecord = (value: unknown): value is Record<string, unknown> => {
	return typeof value === "object" && value !== null && !Array.isArray(value);
};

const toWordingMatch = (
	value: unknown,
): DocumentPlacementDto["matches"][number] | null => {
	if (!isRecord(value)) {
		return null;
	}

	const { content, nodeId, span, title } = value;

	if (
		typeof content !== "string" ||
		typeof nodeId !== "number" ||
		typeof span !== "string" ||
		typeof title !== "string" ||
		span.trim() === ""
	) {
		return null;
	}

	return { content, nodeId, span: span.trim(), title };
};

const parsePlacementValue = (value: unknown): unknown => {
	if (typeof value !== "string") {
		return value;
	}

	try {
		return JSON.parse(value) as unknown;
	} catch {
		return null;
	}
};

const toDocumentPlacement = (value: unknown): DocumentPlacementDto => {
	const parsed = parsePlacementValue(value);

	if (!isRecord(parsed)) {
		return {
			matches: [],
			parentExtractionItemId: null,
			parentId: null,
			parentTitle: null,
			proposesParent: false,
			siblingOrder: null,
		};
	}

	const matches = Array.isArray(parsed["matches"])
		? parsed["matches"].flatMap((item) => {
				const match = toWordingMatch(item);

				return match ? [match] : [];
			})
		: [];
	const parentId =
		typeof parsed["parentId"] === "number" ? parsed["parentId"] : null;
	const parentTitle =
		typeof parsed["parentTitle"] === "string" ? parsed["parentTitle"] : null;

	return {
		matches,
		parentExtractionItemId:
			typeof parsed["parentExtractionItemId"] === "number"
				? parsed["parentExtractionItemId"]
				: null,
		parentId,
		parentTitle,
		proposesParent: parsed["proposesParent"] === true,
		siblingOrder:
			typeof parsed["siblingOrder"] === "number" &&
			Number.isSafeInteger(parsed["siblingOrder"]) &&
			parsed["siblingOrder"] >= FIRST_SIBLING_ORDER
				? parsed["siblingOrder"]
				: null,
	};
};

export { toDocumentPlacement };
