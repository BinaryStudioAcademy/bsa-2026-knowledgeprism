import {
	confirmDocumentUpload,
	fetchIntegrationChanges,
	fetchKnowledgeEntry,
	fetchKnowledgeTree,
	processDocument,
	searchKnowledge,
	submitManualText,
	updateKnowledgeEntry,
} from "./actions.js";
import { actions } from "./knowledge.slice.js";

const allActions = {
	...actions,
	confirmDocumentUpload,
	fetchIntegrationChanges,
	fetchKnowledgeEntry,
	fetchKnowledgeTree,
	processDocument,
	searchKnowledge,
	submitManualText,
	updateKnowledgeEntry,
};

export { allActions as actions };
export { reducer } from "./knowledge.slice.js";
