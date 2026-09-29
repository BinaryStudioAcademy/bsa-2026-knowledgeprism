import { HTTPCode, UserValidationMessage } from "@knowledgeprism/constants";

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
	const isInactiveUser = error.message === UserValidationMessage.USER_INACTIVE;

	if (error.status === undefined) {
		if (isInactiveUser) {
			return error.message;
		}

		return NotificationFallbackMessage.CONNECTION_FAILED;
	}

	if (error.status >= HTTPCode.INTERNAL_SERVER_ERROR) {
		return NotificationFallbackMessage.SERVER_ERROR;
	}

	const hasMessage = Boolean(error.message.trim());

	if (hasMessage && isClientError(error.status)) {
		return error.message;
	}

	return NotificationFallbackMessage.CONNECTION_FAILED;
};

export { getNotificationMessage };
