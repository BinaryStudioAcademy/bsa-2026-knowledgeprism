import { HTTPCode } from "@knowledgeprism/constants";

import { type AppError } from "../types/app-error.type.js";

const NotificationFallbackMessage = {
	CONNECTION_FAILED:
		"Can't reach the server. Please check your connection and try again.",
	SERVER_ERROR:
		"Something went wrong on our side. Please try again in a moment.",
} as const;

const getNotificationMessage = (error: AppError): string => {
	if (error.status === undefined) {
		return NotificationFallbackMessage.CONNECTION_FAILED;
	}
	if (error.status >= HTTPCode.INTERNAL_SERVER_ERROR) {
		return NotificationFallbackMessage.SERVER_ERROR;
	}

	return error.message;
};

export { getNotificationMessage };
