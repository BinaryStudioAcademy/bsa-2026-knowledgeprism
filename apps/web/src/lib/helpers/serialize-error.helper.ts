import { miniSerializeError } from "@reduxjs/toolkit";

import { HTTPError } from "~/lib/http/libs/exceptions/http-error.exception.js";
import { type SerializedAppError } from "~/lib/types/serialized-app-error.type.js";

const serializeError = (error: unknown): SerializedAppError => {
	const serializedError = miniSerializeError(error);

	if (error instanceof HTTPError) {
		return {
			...serializedError,
			details: error.details,
			errorType: error.errorType,
			status: error.status,
		};
	}

	return serializedError;
};

export { serializeError };
