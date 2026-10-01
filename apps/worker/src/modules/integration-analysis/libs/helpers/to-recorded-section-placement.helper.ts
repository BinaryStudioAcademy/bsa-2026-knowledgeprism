import {
	type PlacementTreeNode,
	type PriorSectionPlacement,
} from "../types/integration-analysis-parameters.type.js";
import { type IntegrationAnalysisResult } from "../types/integration-analysis-result.type.js";

type RecordedSectionPlacement = PriorSectionPlacement & {
	extractionItemId: number;
};

type SectionPlacementRecord = {
	parentExtractionItemId: null | number;
	parentId: null | number;
	parentTitle: null | string;
	proposesParent: boolean;
	recorded: RecordedSectionPlacement;
	siblingOrder: null | number;
};

const toRecordedSectionPlacement = <T>({
	extractionItemId,
	priorPlacements,
	result,
	title,
	tree,
}: {
	extractionItemId: number;
	priorPlacements: RecordedSectionPlacement[];
	result: IntegrationAnalysisResult<T>;
	title: string;
	tree: PlacementTreeNode[];
}): SectionPlacementRecord => {
	const recordedBase = {
		extractionItemId,
		siblingOrder: result.siblingOrder,
		title,
		type: result.type,
	};

	if (result.parentPriorIndex !== null) {
		const priorParent = priorPlacements[result.parentPriorIndex];

		if (!priorParent) {
			return {
				parentExtractionItemId: null,
				parentId: null,
				parentTitle: null,
				proposesParent: false,
				recorded: {
					...recordedBase,
					parentPriorIndex: null,
					parentTreeIndex: null,
					proposesParent: false,
				},
				siblingOrder: result.siblingOrder,
			};
		}

		return {
			parentExtractionItemId: priorParent.extractionItemId,
			parentId: null,
			parentTitle: priorParent.title,
			proposesParent: true,
			recorded: {
				...recordedBase,
				parentPriorIndex: result.parentPriorIndex,
				parentTreeIndex: null,
				proposesParent: true,
			},
			siblingOrder: result.siblingOrder,
		};
	}

	if (result.parentIndex !== null) {
		const parent = tree[result.parentIndex];

		if (!parent || !result.proposesParent) {
			return {
				parentExtractionItemId: null,
				parentId: null,
				parentTitle: null,
				proposesParent: false,
				recorded: {
					...recordedBase,
					parentPriorIndex: null,
					parentTreeIndex: null,
					proposesParent: false,
				},
				siblingOrder: result.siblingOrder,
			};
		}

		return {
			parentExtractionItemId: null,
			parentId: parent.id,
			parentTitle: parent.title,
			proposesParent: true,
			recorded: {
				...recordedBase,
				parentPriorIndex: null,
				parentTreeIndex: result.parentIndex,
				proposesParent: true,
			},
			siblingOrder: result.siblingOrder,
		};
	}

	const isParentProposed = result.proposesParent;

	return {
		parentExtractionItemId: null,
		parentId: null,
		parentTitle: null,
		proposesParent: isParentProposed,
		recorded: {
			...recordedBase,
			parentPriorIndex: null,
			parentTreeIndex: null,
			proposesParent: isParentProposed,
		},
		siblingOrder: result.siblingOrder,
	};
};

export { toRecordedSectionPlacement };
export type { RecordedSectionPlacement };
