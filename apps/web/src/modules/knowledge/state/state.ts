import { processDocument } from "./actions.js";
import { actions } from "./knowledge.slice.js";

const allActions = {
	...actions,
	processDocument,
};

export { allActions as actions };
export { reducer } from "./knowledge.slice.js";
