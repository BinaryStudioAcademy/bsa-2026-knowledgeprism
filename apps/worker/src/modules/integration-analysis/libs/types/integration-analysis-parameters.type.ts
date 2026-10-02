import { type EmbeddingCandidate } from "../../../embeddings/libs/types/embedding-candidate.type.js";
import { type EmbeddingVector } from "../../../embeddings/libs/types/embedding-vector.type.js";
import { type IntegrationChangeTypeValue } from "./integration-change-type-value.type.js";

type IntegrationAnalysisParameters<T> = {
	candidates: EmbeddingCandidate<T>[];
	documents?: PlacementTreeNode[];
	itemText: string;
	itemVectors?: EmbeddingVector[];
	priorPlacements?: PriorSectionPlacement[];
};

type PlacementTreeNode = {
	id: number;
	parentId: null | number;
	position: number;
	title: string;
	type: string;
};

type PriorSectionPlacement = {
	parentPriorIndex: null | number;
	parentTreeIndex: null | number;
	proposesParent: boolean;
	siblingOrder: null | number;
	title: string;
	type: IntegrationChangeTypeValue;
};

export {
	type IntegrationAnalysisParameters,
	type PlacementTreeNode,
	type PriorSectionPlacement,
};
