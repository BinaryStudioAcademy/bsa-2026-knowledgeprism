import { processDocument, searchKnowledge } from "./actions.js";
import { actions } from "./knowledge.slice.js";

const allActions = {
	...actions,
	processDocument,
	searchKnowledge,
};

export { allActions as actions };
export { reducer } from "./knowledge.slice.js";
