import {
	applyIntegrationChanges,
	confirmDocumentUpload,
	fetchIntegrationChanges,
	fetchKnowledgeEntry,
	fetchKnowledgeTree,
	processDocument,
	searchKnowledgeEntries,
	submitManualText,
	updateKnowledgeEntry,
} from "./actions.js";
import { actions } from "./knowledge.slice.js";

const allActions = {
	...actions,
	applyIntegrationChanges,
	confirmDocumentUpload,
	fetchIntegrationChanges,
	fetchKnowledgeEntry,
	fetchKnowledgeTree,
	processDocument,
	searchKnowledgeEntries,
	submitManualText,
	updateKnowledgeEntry,
};

export { allActions as actions };
export { reducer } from "./knowledge.slice.js";
