import {
	confirmDocumentUpload,
	fetchExtractionItems,
	fetchKnowledgeEntry,
	fetchKnowledgeTree,
	pollDocumentStatus,
	processDocument,
	retryDocumentProcessing,
	searchKnowledge,
	submitExtractionReview,
	submitManualText,
	updateKnowledgeEntry,
} from "./actions.js";
import { actions as sliceActions } from "./knowledge.slice.js";

const allActions = {
	...sliceActions,
	confirmDocumentUpload,
	fetchExtractionItems,
	fetchKnowledgeEntry,
	fetchKnowledgeTree,
	pollDocumentStatus,
	processDocument,
	retryDocumentProcessing,
	searchKnowledge,
	submitExtractionReview,
	submitManualText,
	updateKnowledgeEntry,
};

export { allActions as actions };
export { reducer } from "./knowledge.slice.js";
