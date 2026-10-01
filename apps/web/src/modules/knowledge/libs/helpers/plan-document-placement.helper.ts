import {
	KnowledgeNodeType,
	KnowledgeValidationRule,
} from "@knowledgeprism/constants";
import { type KnowledgeTreeItemResponseDto } from "@knowledgeprism/types";

const DEPTH_STEP = 1;
const EMPTY_LENGTH = 0;
const FIRST_DEPTH = 1;
const ROOT_PARENT_DEPTH = 0;

const DropZone = {
	AFTER: "after",
	BEFORE: "before",
	INSIDE: "inside",
} as const;

type DocumentPlacement = {
	parentId: null | number;
	position: number;
};

type DropZoneValue = (typeof DropZone)[keyof typeof DropZone];

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

const planMoveToParent = (
	items: KnowledgeTreeItemResponseDto[],
	nodeId: number,
	parentId: null | number,
): DocumentPlacement | null => {
	const node = items.find((item) => item.id === nodeId);

	if (!node || node.parentId === parentId) {
		return null;
	}

	if (!canPlaceDocument(items, nodeId, parentId)) {
		return null;
	}

	return {
		parentId,
		position: getSiblings(items, parentId).length,
	};
};

type DropTarget = {
	target: KnowledgeTreeItemResponseDto;
	zone: DropZoneValue;
};

const planDropBeside = (
	items: KnowledgeTreeItemResponseDto[],
	nodeId: number,
	{ target, zone }: DropTarget,
): DocumentPlacement | null => {
	const node = items.find((item) => item.id === nodeId);

	if (!node || !isDocumentNode(target.type)) {
		return null;
	}

	if (!canPlaceDocument(items, nodeId, target.parentId)) {
		return null;
	}

	const siblings = getSiblings(items, target.parentId).filter(
		(item) => item.id !== nodeId,
	);
	const targetIndex = siblings.findIndex((item) => item.id === target.id);
	const position =
		zone === DropZone.BEFORE ? targetIndex : targetIndex + DEPTH_STEP;
	const currentIndex = getSiblings(items, node.parentId).findIndex(
		(item) => item.id === nodeId,
	);
	const isUnchanged =
		currentIndex === position && node.parentId === target.parentId;

	return isUnchanged ? null : { parentId: target.parentId, position };
};

const planDrop = (
	items: KnowledgeTreeItemResponseDto[],
	nodeId: number,
	{ targetId, zone }: { targetId: number; zone: DropZoneValue },
): DocumentPlacement | null => {
	const target = items.find((item) => item.id === targetId);

	if (!target || nodeId === targetId) {
		return null;
	}

	if (zone === DropZone.INSIDE) {
		return isDocumentNode(target.type)
			? planMoveToParent(items, nodeId, targetId)
			: null;
	}

	if (isInsideSubtree(items, nodeId, targetId)) {
		return null;
	}

	return planDropBeside(items, nodeId, { target, zone });
};

export {
	type DocumentPlacement,
	type DropZoneValue,
	canAddSubdocument,
	canPlaceDocument,
	DropZone,
	isDocumentNode,
	planDrop,
	planMoveToParent,
};
