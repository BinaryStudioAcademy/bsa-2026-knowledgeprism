import { isRejected, type Middleware } from "@reduxjs/toolkit";

import { normalizeError } from "../helpers/normalize-error.helper.js";
import { actions as errorActions } from "./error.slice.js";

const errorMiddleware: Middleware =
	({ dispatch }) =>
	(next) =>
	(action) => {
		const result = next(action);

		if (isRejected(action) && !action.meta.aborted && !action.meta.condition) {
			const error = action.payload ?? action.error;

			dispatch(errorActions.setError(normalizeError(error)));
		}

		return result;
	};

export { errorMiddleware };
