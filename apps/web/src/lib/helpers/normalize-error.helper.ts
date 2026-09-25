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

const isRecord = (value: unknown): value is Record<string, unknown> => {
	return typeof value === "object" && value !== null;
};

const parseJsonSafe = (value: string): unknown => {
	try {
		return JSON.parse(value);
	} catch {
		return null;
	}
};

const extractErrorMessage = (candidate: Record<string, unknown>): string => {
	const message = candidate["message"];

	if (typeof message !== "string" || message.trim() === "") {
		return DEFAULT_ERROR_MESSAGE;
	}

	const parsed = parseJsonSafe(message);

	if (isRecord(parsed)) {
		const nestedMessage = parsed["message"];

		if (typeof nestedMessage === "string" && nestedMessage.trim() !== "") {
			return nestedMessage;
		}
	}

	return message;
};

const normalizeStringError = (error: string): AppError => {
	const parsed = parseJsonSafe(error);

	if (isRecord(parsed)) {
		return normalizeError(parsed);
	}

	return {
		message: error.trim() === "" ? DEFAULT_ERROR_MESSAGE : error,
	};
};

const normalizeError = (error: unknown): AppError => {
	if (typeof error === "string") {
		return normalizeStringError(error);
	}

	if (!isRecord(error)) {
		return {
			message: DEFAULT_ERROR_MESSAGE,
		};
	}

	const normalizedError: AppError = {
		message: extractErrorMessage(error),
	};

	const details = error["details"];

	if (Array.isArray(details) && details.every(isServerErrorDetail)) {
		normalizedError.details = details;
	}

	const errorType = error["errorType"];

	if (isServerErrorType(errorType)) {
		normalizedError.errorType = errorType;
	}

	const status = error["status"];

	if (typeof status === "number") {
		normalizedError.status = status;
	}

	return normalizedError;
};

export { normalizeError };
