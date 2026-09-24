import {
	confirmDocumentUpload,
	processDocument,
	searchKnowledge,
	submitManualText,
} from "./actions.js";
import { actions } from "./knowledge.slice.js";

const allActions = {
	...actions,
	confirmDocumentUpload,
	processDocument,
	searchKnowledge,
	submitManualText,
};

export { allActions as actions };
export { reducer } from "./knowledge.slice.js";
