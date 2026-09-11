import { isRejected, type Middleware } from "@reduxjs/toolkit";

import { errorService } from "~/lib/errors/error.service.js";

const handleRejectedAction: ReturnType<Middleware> = (next) => (action) => {
	const result = next(action);

	if (isRejected(action) && !action.meta.aborted && !action.meta.condition) {
		errorService.notify(action.payload ?? action.error);
	}

	return result;
};

const errorMiddleware: Middleware = () => handleRejectedAction;

export { errorMiddleware };
