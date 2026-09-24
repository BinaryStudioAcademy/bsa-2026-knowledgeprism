import {
	confirmDocumentUpload,
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
	fetchKnowledgeEntry,
	fetchKnowledgeTree,
	processDocument,
	searchKnowledge,
	submitManualText,
	updateKnowledgeEntry,
};

export { allActions as actions };
export { reducer } from "./knowledge.slice.js";
