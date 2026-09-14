import { askQuestion, loadSuggestedQuestions } from "./actions.js";
import { actions } from "./ask-prism.slice.js";

const allActions = {
	...actions,
	askQuestion,
	loadSuggestedQuestions,
};

export { allActions as actions };
export { reducer } from "./ask-prism.slice.js";
