import { logout, signUp } from "./actions.js";
import { actions } from "./auth.slice.js";

const allActions = {
	...actions,
	logout,
	signUp,
};

export { allActions as actions };
export { reducer } from "./auth.slice.js";
