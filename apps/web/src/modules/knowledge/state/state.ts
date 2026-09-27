import {
	applyIntegrationChanges,
	confirmDocumentUpload,
	fetchExtractionItems,
	fetchIntegrationChanges,
	fetchKnowledgeEntry,
	fetchKnowledgeTree,
	fetchPendingReviewDocuments,
	initializeProjectKnowledgePipeline,
	pollDocumentStatus,
	processDocument,
	resumeNextPendingReview,
	retryDocumentProcessing,
	searchKnowledge,
	submitExtractionReview,
	submitManualText,
	switchActiveDocument,
	updateExtractionItem,
	updateKnowledgeEntry,
} from "./actions.js";
import { actions as sliceActions } from "./knowledge.slice.js";

const allActions = {
	...sliceActions,
	applyIntegrationChanges,
	confirmDocumentUpload,
	fetchExtractionItems,
	fetchIntegrationChanges,
	fetchKnowledgeEntry,
	fetchKnowledgeTree,
	fetchPendingReviewDocuments,
	initializeProjectKnowledgePipeline,
	pollDocumentStatus,
	processDocument,
	resumeNextPendingReview,
	retryDocumentProcessing,
	searchKnowledge,
	submitExtractionReview,
	submitManualText,
	switchActiveDocument,
	updateExtractionItem,
	updateKnowledgeEntry,
};

export { allActions as actions };
export { reducer } from "./knowledge.slice.js";
