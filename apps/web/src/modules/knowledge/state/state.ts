import {
	applyIntegrationChanges,
	checkGlossaryConsistency,
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
	submitExtractionReview,
	submitManualText,
	switchActiveDocument,
	untrackDocument,
	updateExtractionItem,
	updateKnowledgeEntry,
} from "./actions.js";
import { actions as sliceActions } from "./knowledge.slice.js";

const allActions = {
	...sliceActions,
	applyIntegrationChanges,
	checkGlossaryConsistency,
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
	submitExtractionReview,
	submitManualText,
	switchActiveDocument,
	untrackDocument,
	updateExtractionItem,
	updateKnowledgeEntry,
};

export { allActions as actions };
export { reducer } from "./knowledge.slice.js";
