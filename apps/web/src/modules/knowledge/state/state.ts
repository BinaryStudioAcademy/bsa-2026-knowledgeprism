import {
	fetchKnowledgeEntry,
	fetchKnowledgeTree,
	processDocument,
	searchKnowledge,
} from "./actions.js";
import { actions } from "./knowledge.slice.js";

const allActions = {
	...actions,
	fetchKnowledgeEntry,
	fetchKnowledgeTree,
	processDocument,
	searchKnowledge,
};

export { allActions as actions };
export { reducer } from "./knowledge.slice.js";
