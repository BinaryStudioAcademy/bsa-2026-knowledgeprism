import { processDocument } from "./actions.js";
import { actions } from "./add-knowledge.slice.js";

const allActions = {
	...actions,
	processDocument,
};

export { allActions as actions };
export { reducer } from "./add-knowledge.slice.js";
