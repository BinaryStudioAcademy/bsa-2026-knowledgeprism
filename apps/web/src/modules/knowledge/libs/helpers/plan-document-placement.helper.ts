import {
	KnowledgeNodeType,
	KnowledgeValidationRule,
} from "@knowledgeprism/constants";
import { type KnowledgeTreeItemResponseDto } from "@knowledgeprism/types";

const DEPTH_STEP = 1;
const EMPTY_LENGTH = 0;
const FIRST_DEPTH = 1;
const ROOT_PARENT_DEPTH = 0;

type DocumentPlacement = {
	parentId: null | number;
	position: number;
};

const isDocumentNode = (
	type: KnowledgeTreeItemResponseDto["type"],
): boolean => {
	return type === KnowledgeNodeType.PAGE || type === KnowledgeNodeType.SECTION;
};

const compareSiblings = (
	left: KnowledgeTreeItemResponseDto,
	right: KnowledgeTreeItemResponseDto,
): number => {
	if (left.position !== right.position) {
		return left.position - right.position;
	}

	return left.id - right.id;
};

const getSiblings = (
	items: KnowledgeTreeItemResponseDto[],
	parentId: null | number,
): KnowledgeTreeItemResponseDto[] => {
	return items
		.filter((item) => item.parentId === parentId)
		.toSorted(compareSiblings);
};

const getDepth = (
	items: KnowledgeTreeItemResponseDto[],
	nodeId: number,
): number => {
	let depth = FIRST_DEPTH;
	let current = items.find((item) => item.id === nodeId);
	const seen = new Set<number>();

	while (current?.parentId != null) {
		if (seen.has(current.id)) {
			return KnowledgeValidationRule.DOCUMENT_MAXIMUM_DEPTH + DEPTH_STEP;
		}

		seen.add(current.id);
		depth += DEPTH_STEP;
		const parentId = current.parentId;
		current = items.find((item) => item.id === parentId);
	}

	return depth;
};

const getSubtreeSpan = (
	items: KnowledgeTreeItemResponseDto[],
	nodeId: number,
	seen: Set<number>,
): number => {
	if (seen.has(nodeId)) {
		return KnowledgeValidationRule.DOCUMENT_MAXIMUM_DEPTH + DEPTH_STEP;
	}

	const nextSeen = new Set(seen);
	nextSeen.add(nodeId);
	const children = items.filter((item) => item.parentId === nodeId);

	if (children.length === EMPTY_LENGTH) {
		return FIRST_DEPTH;
	}

	return (
		FIRST_DEPTH +
		Math.max(
			...children.map((child) => getSubtreeSpan(items, child.id, nextSeen)),
		)
	);
};

const isInsideSubtree = (
	items: KnowledgeTreeItemResponseDto[],
	rootId: number,
	candidateId: number,
): boolean => {
	let currentId: null | number = candidateId;
	const seen = new Set<number>();

	while (currentId !== null) {
		if (currentId === rootId || seen.has(currentId)) {
			return true;
		}

		seen.add(currentId);
		currentId = items.find((item) => item.id === currentId)?.parentId ?? null;
	}

	return false;
};

const canPlaceDocument = (
	items: KnowledgeTreeItemResponseDto[],
	nodeId: number,
	parentId: null | number,
): boolean => {
	const node = items.find((item) => item.id === nodeId);

	if (!node || !isDocumentNode(node.type)) {
		return false;
	}

	if (parentId !== null) {
		const parent = items.find((item) => item.id === parentId);

		if (
			!parent ||
			!isDocumentNode(parent.type) ||
			isInsideSubtree(items, nodeId, parentId)
		) {
			return false;
		}
	}

	const parentDepth =
		parentId === null ? ROOT_PARENT_DEPTH : getDepth(items, parentId);

	return (
		parentDepth + getSubtreeSpan(items, nodeId, new Set()) <=
		KnowledgeValidationRule.DOCUMENT_MAXIMUM_DEPTH
	);
};

const canAddSubdocument = (
	items: KnowledgeTreeItemResponseDto[],
	parentId: number,
): boolean => {
	const parent = items.find((item) => item.id === parentId);

	if (!parent || !isDocumentNode(parent.type)) {
		return false;
	}

	return (
		getDepth(items, parentId) < KnowledgeValidationRule.DOCUMENT_MAXIMUM_DEPTH
	);
};

const planMoveUp = (
	items: KnowledgeTreeItemResponseDto[],
	nodeId: number,
): DocumentPlacement | null => {
	const node = items.find((item) => item.id === nodeId);

	if (!node || !isDocumentNode(node.type)) {
		return null;
	}

	const siblings = getSiblings(items, node.parentId);
	const index = siblings.findIndex((item) => item.id === nodeId);

	if (index <= KnowledgeValidationRule.POSITION_MINIMUM) {
		return null;
	}

	return { parentId: node.parentId, position: index - DEPTH_STEP };
};

const planMoveDown = (
	items: KnowledgeTreeItemResponseDto[],
	nodeId: number,
): DocumentPlacement | null => {
	const node = items.find((item) => item.id === nodeId);

	if (!node || !isDocumentNode(node.type)) {
		return null;
	}

	const siblings = getSiblings(items, node.parentId);
	const index = siblings.findIndex((item) => item.id === nodeId);
	const lastIndex = siblings.length - DEPTH_STEP;

	if (index < KnowledgeValidationRule.POSITION_MINIMUM || index >= lastIndex) {
		return null;
	}

	return { parentId: node.parentId, position: index + DEPTH_STEP };
};

const planNestUnderPrevious = (
	items: KnowledgeTreeItemResponseDto[],
	nodeId: number,
): DocumentPlacement | null => {
	const node = items.find((item) => item.id === nodeId);

	if (!node || !isDocumentNode(node.type)) {
		return null;
	}

	const siblings = getSiblings(items, node.parentId);
	const index = siblings.findIndex((item) => item.id === nodeId);
	const previous = siblings[index - DEPTH_STEP];

	if (!previous || !isDocumentNode(previous.type)) {
		return null;
	}

	if (!canPlaceDocument(items, nodeId, previous.id)) {
		return null;
	}

	return {
		parentId: previous.id,
		position: getSiblings(items, previous.id).length,
	};
};

const planMoveOut = (
	items: KnowledgeTreeItemResponseDto[],
	nodeId: number,
): DocumentPlacement | null => {
	const node = items.find((item) => item.id === nodeId);

	if (!node?.parentId || !isDocumentNode(node.type)) {
		return null;
	}

	const parent = items.find((item) => item.id === node.parentId);

	if (!parent) {
		return null;
	}

	if (!canPlaceDocument(items, nodeId, parent.parentId)) {
		return null;
	}

	const parentSiblings = getSiblings(items, parent.parentId);
	const parentIndex = parentSiblings.findIndex((item) => item.id === parent.id);

	if (parentIndex < KnowledgeValidationRule.POSITION_MINIMUM) {
		return null;
	}

	return {
		parentId: parent.parentId,
		position: parentIndex + DEPTH_STEP,
	};
};

export {
	type DocumentPlacement,
	canAddSubdocument,
	isDocumentNode,
	planMoveDown,
	planMoveOut,
	planMoveUp,
	planNestUnderPrevious,
};
