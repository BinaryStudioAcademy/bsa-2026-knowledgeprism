import {
	KnowledgeNodeType,
	KnowledgeValidationMessage,
	KnowledgeValidationRule,
} from "@knowledgeprism/constants";
import { type ValueOf } from "@knowledgeprism/types";

const DEPTH_STEP = 1;
const EMPTY_LENGTH = 0;
const FIRST_DEPTH = 1;
const POSITION_STEP = 1;
const ROOT_PARENT_DEPTH = 0;

type PlacementNode = {
	id: number;
	parentId: null | number;
	position: number;
	type: ValueOf<typeof KnowledgeNodeType>;
};

type PlannedDocumentCreate = {
	parentId: null | number;
	position: number;
};

type PlannedPlacement = {
	id: number;
	parentId: null | number;
	position: number;
};

class DocumentPlacementError extends Error {
	public constructor(message: string) {
		super(message);
		this.name = "DocumentPlacementError";
	}
}

const isDocumentNode = (type: PlacementNode["type"]): boolean => {
	return type === KnowledgeNodeType.PAGE || type === KnowledgeNodeType.SECTION;
};

const compareSiblings = (left: PlacementNode, right: PlacementNode): number => {
	if (left.position !== right.position) {
		return left.position - right.position;
	}

	return left.id - right.id;
};

const getSiblings = (
	nodes: PlacementNode[],
	parentId: null | number,
	excludedId?: number,
): PlacementNode[] => {
	return nodes
		.filter((node) => node.parentId === parentId && node.id !== excludedId)
		.toSorted(compareSiblings);
};

const getDepth = (nodes: PlacementNode[], nodeId: number): number => {
	const currentNode = nodes.find((node) => node.id === nodeId);

	if (!currentNode) {
		throw new DocumentPlacementError(
			KnowledgeValidationMessage.PARENT_NOT_FOUND,
		);
	}

	let depth = FIRST_DEPTH;
	let current = currentNode;
	const seen = new Set<number>();

	while (current.parentId !== null) {
		if (seen.has(current.id)) {
			throw new DocumentPlacementError(
				KnowledgeValidationMessage.DOCUMENT_CYCLE,
			);
		}

		seen.add(current.id);
		const parent = nodes.find((node) => node.id === current.parentId);

		if (!parent) {
			throw new DocumentPlacementError(
				KnowledgeValidationMessage.PARENT_NOT_FOUND,
			);
		}

		depth += DEPTH_STEP;
		current = parent;
	}

	return depth;
};

const getSubtreeSpan = (
	nodes: PlacementNode[],
	nodeId: number,
	seen: Set<number>,
): number => {
	if (seen.has(nodeId)) {
		throw new DocumentPlacementError(KnowledgeValidationMessage.DOCUMENT_CYCLE);
	}

	const nextSeen = new Set(seen);
	nextSeen.add(nodeId);
	const children = nodes.filter((node) => node.parentId === nodeId);

	if (children.length === EMPTY_LENGTH) {
		return FIRST_DEPTH;
	}

	return (
		FIRST_DEPTH +
		Math.max(
			...children.map((child) => getSubtreeSpan(nodes, child.id, nextSeen)),
		)
	);
};

const isInsideSubtree = (
	nodes: PlacementNode[],
	rootId: number,
	candidateId: number,
): boolean => {
	let currentId: null | number = candidateId;
	const seen = new Set<number>();

	while (currentId !== null) {
		if (currentId === rootId) {
			return true;
		}

		if (seen.has(currentId)) {
			throw new DocumentPlacementError(
				KnowledgeValidationMessage.DOCUMENT_CYCLE,
			);
		}

		seen.add(currentId);
		const current = nodes.find((node) => node.id === currentId);
		currentId = current?.parentId ?? null;
	}

	return false;
};

const assertWithinDepth = (parentDepth: number, span: number): void => {
	if (parentDepth + span > KnowledgeValidationRule.DOCUMENT_MAXIMUM_DEPTH) {
		throw new DocumentPlacementError(
			KnowledgeValidationMessage.DOCUMENT_DEPTH_EXCEEDED,
		);
	}
};

const assertDocumentParent = (
	nodes: PlacementNode[],
	parentId: number,
): PlacementNode => {
	const parent = nodes.find((node) => node.id === parentId);

	if (!parent) {
		throw new DocumentPlacementError(
			KnowledgeValidationMessage.PARENT_NOT_FOUND,
		);
	}

	if (!isDocumentNode(parent.type)) {
		throw new DocumentPlacementError(
			KnowledgeValidationMessage.DOCUMENT_PARENT_INVALID,
		);
	}

	return parent;
};

const nextSiblingPosition = (siblings: PlacementNode[]): number => {
	if (siblings.length === EMPTY_LENGTH) {
		return KnowledgeValidationRule.POSITION_MINIMUM;
	}

	return (
		Math.max(...siblings.map((sibling) => sibling.position)) + POSITION_STEP
	);
};

const collectRemovedDocumentIds = (
	nodes: PlacementNode[],
	nodeId: number,
	seen: Set<number>,
): number[] => {
	if (seen.has(nodeId)) {
		throw new DocumentPlacementError(KnowledgeValidationMessage.DOCUMENT_CYCLE);
	}

	const nextSeen = new Set(seen);
	nextSeen.add(nodeId);
	const removedIds: number[] = [];
	const children = nodes
		.filter((node) => node.parentId === nodeId)
		.toSorted(compareSiblings);

	for (const child of children) {
		removedIds.push(...collectRemovedDocumentIds(nodes, child.id, nextSeen));
	}

	removedIds.push(nodeId);

	return removedIds;
};

const planDocumentRemove = ({
	nodeId,
	nodes,
}: {
	nodeId: number;
	nodes: PlacementNode[];
}): number[] => {
	if (nodes.every((item) => item.id !== nodeId)) {
		throw new DocumentPlacementError(KnowledgeValidationMessage.NOT_FOUND);
	}

	return collectRemovedDocumentIds(nodes, nodeId, new Set());
};

const planDocumentCreate = ({
	nodes,
	parentId,
}: {
	nodes: PlacementNode[];
	parentId: null | number;
}): PlannedDocumentCreate => {
	if (parentId !== null) {
		assertDocumentParent(nodes, parentId);
		assertWithinDepth(getDepth(nodes, parentId), FIRST_DEPTH);
	}

	return {
		parentId,
		position: nextSiblingPosition(getSiblings(nodes, parentId)),
	};
};

const collectPlacementUpdates = (
	siblings: PlacementNode[],
	movedNodeId: number,
	movedParentId: null | number,
): PlannedPlacement[] => {
	const updates: PlannedPlacement[] = [];

	for (const [index, sibling] of siblings.entries()) {
		const nextParentId =
			sibling.id === movedNodeId ? movedParentId : sibling.parentId;

		if (sibling.position !== index || sibling.parentId !== nextParentId) {
			updates.push({
				id: sibling.id,
				parentId: nextParentId,
				position: index,
			});
		}
	}

	return updates;
};

const planDocumentMove = ({
	nodeId,
	nodes,
	parentId,
	position,
}: {
	nodeId: number;
	nodes: PlacementNode[];
	parentId: null | number;
	position: number;
}): PlannedPlacement[] => {
	const node = nodes.find((item) => item.id === nodeId);

	if (!node) {
		throw new DocumentPlacementError(KnowledgeValidationMessage.NOT_FOUND);
	}

	if (!isDocumentNode(node.type)) {
		throw new DocumentPlacementError(
			KnowledgeValidationMessage.DOCUMENT_MOVE_INVALID,
		);
	}

	if (parentId !== null) {
		assertDocumentParent(nodes, parentId);

		if (isInsideSubtree(nodes, nodeId, parentId)) {
			throw new DocumentPlacementError(
				KnowledgeValidationMessage.DOCUMENT_CYCLE,
			);
		}
	}

	const parentDepth =
		parentId === null ? ROOT_PARENT_DEPTH : getDepth(nodes, parentId);
	assertWithinDepth(parentDepth, getSubtreeSpan(nodes, nodeId, new Set()));

	const destination = getSiblings(nodes, parentId, nodeId);

	if (
		position < KnowledgeValidationRule.POSITION_MINIMUM ||
		position > destination.length
	) {
		throw new DocumentPlacementError(
			KnowledgeValidationMessage.DOCUMENT_POSITION_INVALID,
		);
	}

	const placed = [
		...destination.slice(KnowledgeValidationRule.POSITION_MINIMUM, position),
		node,
		...destination.slice(position),
	];
	const updates = collectPlacementUpdates(placed, nodeId, parentId);

	if (node.parentId === parentId) {
		return updates;
	}

	const origin = getSiblings(nodes, node.parentId, nodeId);

	return [
		...updates,
		...collectPlacementUpdates(origin, nodeId, node.parentId),
	];
};

export {
	type PlacementNode,
	DocumentPlacementError,
	planDocumentCreate,
	planDocumentMove,
	planDocumentRemove,
};
