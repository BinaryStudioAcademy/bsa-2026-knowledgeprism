import {
	CANDIDATES_TAG,
	ITEM_TAG,
	PRIOR_TAG,
	TREE_TAG,
} from "../constants/classification-prompt.constant.js";
import {
	type PlacementTreeNode,
	type PriorSectionPlacement,
} from "../types/integration-analysis-parameters.type.js";

const NULL_PARENT = "null";
const ORDER_UNSET = "unset";

const ParentLabel = {
	ROOT: "root",
	UNSET: "unset",
} as const;

type ClassificationRequest = {
	candidateTexts: string[];
	itemText: string;
	priorPlacements: PriorSectionPlacement[];
	tree: PlacementTreeNode[];
};

const toCandidateLines = (candidateTexts: string[]): string => {
	return candidateTexts
		.map((text, index) => {
			return `${index.toString()}: ${text}`;
		})
		.join("\n");
};

const toParentLabel = (placement: PriorSectionPlacement): string => {
	if (!placement.proposesParent) {
		return ParentLabel.UNSET;
	}

	if (placement.parentPriorIndex !== null) {
		return `prior:${placement.parentPriorIndex.toString()}`;
	}

	if (placement.parentTreeIndex !== null) {
		return `tree:${placement.parentTreeIndex.toString()}`;
	}

	return ParentLabel.ROOT;
};

const toOrderLabel = (siblingOrder: null | number): string => {
	return siblingOrder === null ? ORDER_UNSET : siblingOrder.toString();
};

const toTreeLines = (nodes: PlacementTreeNode[]): string => {
	const indexById = new Map(
		nodes.map((node, index) => {
			return [node.id, index];
		}),
	);

	return nodes
		.map((node, index) => {
			const parentIndex =
				node.parentId === null ? undefined : indexById.get(node.parentId);
			const parent =
				parentIndex === undefined ? NULL_PARENT : parentIndex.toString();

			return `${index.toString()} | parent=${parent} | position=${node.position.toString()} | ${node.type} | ${node.title}`;
		})
		.join("\n");
};

const toPriorLines = (placements: PriorSectionPlacement[]): string => {
	return placements
		.map((placement, index) => {
			return `${index.toString()} | ${placement.type} | parent=${toParentLabel(placement)} | order=${toOrderLabel(placement.siblingOrder)} | ${placement.title}`;
		})
		.join("\n");
};

const toClassificationPrompt = ({
	candidateTexts,
	itemText,
	priorPlacements,
	tree,
}: ClassificationRequest): string => {
	return [
		`<${ITEM_TAG}>`,
		itemText,
		`</${ITEM_TAG}>`,
		`<${CANDIDATES_TAG}>`,
		toCandidateLines(candidateTexts),
		`</${CANDIDATES_TAG}>`,
		`<${TREE_TAG}>`,
		toTreeLines(tree),
		`</${TREE_TAG}>`,
		`<${PRIOR_TAG}>`,
		toPriorLines(priorPlacements),
		`</${PRIOR_TAG}>`,
	].join("\n");
};

export { toClassificationPrompt };
export type { ClassificationRequest };
