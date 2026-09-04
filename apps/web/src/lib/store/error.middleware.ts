import { type Middleware } from "@reduxjs/toolkit";

type NormalizedError = {
	message: string;
	status?: number;
	errorType?: string;
	details?: unknown[];
};

const normalizeError = (error: unknown): NormalizedError => {
	if (error && typeof error === "object") {
		const candidate = error as Record<string, unknown>;
		const message = candidate["message"];

		if (typeof message === "string") {
			const normalized: NormalizedError = { message };

			const status = candidate["status"];
			if (typeof status === "number") {
				normalized.status = status;
			}

			const errorType = candidate["errorType"];
			if (typeof errorType === "string") {
				normalized.errorType = errorType;
			}

			const details = candidate["details"];
			if (Array.isArray(details)) {
				normalized.details = details;
			}

			return normalized;
		}
	}

	if (typeof error === "string") {
		return { message: error };
	}

	return { message: "Something went wrong" };
};

const errorMiddleware: Middleware = () => (next) => (action) => {
	const isRejectedAction =
		typeof action === "object" &&
		action !== null &&
		"type" in action &&
		typeof action.type === "string" &&
		action.type.endsWith("/rejected");

	if (isRejectedAction) {
		const payload = "payload" in action ? action.payload : undefined;
		const error = "error" in action ? action.error : undefined;

		const normalizedError = normalizeError(payload ?? error);
		void normalizedError;
	}

	return next(action);
};

export { errorMiddleware };
