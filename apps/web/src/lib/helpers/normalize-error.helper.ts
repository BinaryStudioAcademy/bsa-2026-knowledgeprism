import { ServerErrorType } from "~/lib/enums/enums.js";
import { type ServerErrorDetail } from "~/lib/types/types.js";

import { type AppError } from "../types/app-error.type.js";

const DEFAULT_ERROR_MESSAGE = "Something went wrong";

const isErrorPathSegment = (value: unknown): value is number | string => {
	return typeof value === "number" || typeof value === "string";
};

const isServerErrorDetail = (value: unknown): value is ServerErrorDetail => {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	const candidate = value as Record<string, unknown>;
	const message = candidate["message"];
	const path = candidate["path"];

	return (
		typeof message === "string" &&
		Array.isArray(path) &&
		path.every(isErrorPathSegment)
	);
};

const isServerErrorType = (
	value: unknown,
): value is NonNullable<AppError["errorType"]> => {
	return (
		value === ServerErrorType.COMMON || value === ServerErrorType.VALIDATION
	);
};

const normalizeError = (error: unknown): AppError => {
	if (typeof error === "string") {
		return {
			message: error.trim() === "" ? DEFAULT_ERROR_MESSAGE : error,
		};
	}

	if (typeof error !== "object" || error === null) {
		return {
			message: DEFAULT_ERROR_MESSAGE,
		};
	}

	const candidate = error as Record<string, unknown>;
	const message = candidate["message"];

	const normalizedError: AppError = {
		message:
			typeof message === "string" && message.trim() !== ""
				? message
				: DEFAULT_ERROR_MESSAGE,
	};

	const details = candidate["details"];

	if (Array.isArray(details) && details.every(isServerErrorDetail)) {
		normalizedError.details = details;
	}

	const errorType = candidate["errorType"];

	if (isServerErrorType(errorType)) {
		normalizedError.errorType = errorType;
	}

	const status = candidate["status"];

	if (typeof status === "number") {
		normalizedError.status = status;
	}

	return normalizedError;
};

export { normalizeError };
