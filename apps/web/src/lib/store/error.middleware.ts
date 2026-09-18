import { isRejected, type Middleware } from "@reduxjs/toolkit";

import { errorService } from "~/lib/errors/error.service.js";

const IGNORED_ACTION_TYPES = new Set([
	"askPrism/ask-question/rejected",
	"askPrism/load-suggested-questions/rejected",
	"auth/load-current-user/rejected",
	"knowledge/process-document/rejected",
]);

const handleRejectedAction: ReturnType<Middleware> = (next) => (action) => {
	const result = next(action);

	if (
		isRejected(action) &&
		!action.meta.aborted &&
		!action.meta.condition &&
		!IGNORED_ACTION_TYPES.has(action.type)
	) {
		errorService.notify(action.payload ?? action.error);
	}

	return result;
};

const errorMiddleware: Middleware = () => handleRejectedAction;

export { errorMiddleware };
