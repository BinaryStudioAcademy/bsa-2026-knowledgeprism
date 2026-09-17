import { createUser, loadAll, loadUserById, updateUser } from "./actions.js";
import { actions } from "./users.slice.js";

const allActions = {
	...actions,
	createUser,
	loadAll,
	loadUserById,
	updateUser,
};

export { allActions as actions };
export { reducer } from "./users.slice.js";
