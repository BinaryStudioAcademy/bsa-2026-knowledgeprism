import { HTTPCode } from "@knowledgeprism/constants";

import { type AppError } from "../types/app-error.type.js";

const NotificationFallbackMessage = {
	CONNECTION_FAILED:
		"Can't reach the server. Please check your connection and try again.",
	SERVER_ERROR:
		"Something went wrong on our side. Please try again in a moment.",
} as const;

const isClientError = (status: number): boolean => {
	return (
		status >= HTTPCode.BAD_REQUEST && status < HTTPCode.INTERNAL_SERVER_ERROR
	);
};

const getNotificationMessage = (error: AppError): string => {
	const hasMessage = Boolean(error.message.trim());

	if (typeof error.status === "number") {
		if (hasMessage && isClientError(error.status)) {
			return error.message;
		}

		if (error.status >= HTTPCode.INTERNAL_SERVER_ERROR) {
			return NotificationFallbackMessage.SERVER_ERROR;
		}
	}

	if (hasMessage) {
		return error.message;
	}

	return NotificationFallbackMessage.CONNECTION_FAILED;
};

export { getNotificationMessage };
