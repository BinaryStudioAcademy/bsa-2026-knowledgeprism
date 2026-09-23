import {
	fetchKnowledgeEntry,
	fetchKnowledgeTree,
	processDocument,
	searchKnowledge,
	updateKnowledgeEntry,
} from "./actions.js";
import { actions as sliceActions } from "./knowledge.slice.js";

const allActions = {
	...sliceActions,
	fetchKnowledgeEntry,
	fetchKnowledgeTree,
	processDocument,
	searchKnowledge,
	updateKnowledgeEntry,
};

export { allActions as actions };
export { reducer } from "./knowledge.slice.js";
