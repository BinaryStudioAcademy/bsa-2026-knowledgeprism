import { HTTPCode } from "@knowledgeprism/constants";

import { type AppError } from "../types/app-error.type.js";
import { DEFAULT_ERROR_MESSAGE } from "./helpers.js";

const NotificationFallbackMessage = {
	CONNECTION_FAILED:
		"Can't reach the server. Please check your connection and try again.",
	SERVER_ERROR:
		"Something went wrong on our side. Please try again in a moment.",
} as const;

const getNotificationMessage = (error: AppError): string => {
	if (
		error.status !== undefined &&
		error.status >= HTTPCode.INTERNAL_SERVER_ERROR
	) {
		return NotificationFallbackMessage.SERVER_ERROR;
	}

	// normalizeError puts DEFAULT_ERROR_MESSAGE in place of a missing message,
	// so matching it means the error carried no text of its own.
	if (error.message === DEFAULT_ERROR_MESSAGE) {
		return NotificationFallbackMessage.CONNECTION_FAILED;
	}

	return error.message;
};

export { getNotificationMessage };
