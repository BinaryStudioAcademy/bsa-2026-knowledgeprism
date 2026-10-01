import {
	confirmTerm,
	createTerm,
	deleteTerm,
	loadTerm,
	loadTermOptions,
	loadTerms,
	updateTerm,
} from "./actions.js";

const actions = {
	confirmTerm,
	createTerm,
	deleteTerm,
	loadTerm,
	loadTermOptions,
	loadTerms,
	updateTerm,
};

export { actions };
export { reducer } from "./glossary.slice.js";
