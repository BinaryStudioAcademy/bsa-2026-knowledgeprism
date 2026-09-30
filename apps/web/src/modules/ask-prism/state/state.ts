import { askQuestion, loadSuggestedQuestions } from "./actions.js";
import { actions } from "./ask-prism.slice.js";

const allActions = {
	...actions,
	askQuestion,
	loadSuggestedQuestions,
};

export { allActions as actions };
export {
	type AskPrismErrorType,
	type AskPrismMessage,
	reducer,
} from "./ask-prism.slice.js";
