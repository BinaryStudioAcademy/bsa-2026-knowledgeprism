import { AuthValidationMessage } from "@knowledgeprism/constants";
import { isRejected, type Middleware } from "@reduxjs/toolkit";

import { NotificationVariant } from "~/lib/enums/enums.js";
import {
	getNotificationMessage,
	normalizeError,
} from "~/lib/helpers/helpers.js";
import { HTTPCode } from "~/lib/http/http.js";
import { notificationService } from "~/lib/notifications/notification.service.js";
import { actions as authActions } from "~/modules/auth/auth.js";

const IGNORED_ACTION_TYPES = new Set([
	"askPrism/ask-question/rejected",
	"askPrism/load-suggested-questions/rejected",
	"auth/load-current-user/rejected",
	"knowledge/confirm-document-upload/rejected",
	"knowledge/process-document/rejected",
	"knowledge/submit-manual-text/rejected",
]);

const AUTH_FORM_ACTION_TYPES = new Set([
	"auth/sign-in/rejected",
	"auth/sign-up/rejected",
]);

const isUnauthorizedError = (error: unknown): boolean => {
	const { message, status } = normalizeError(error);

	return (
		status === HTTPCode.UNAUTHORIZED ||
		message === AuthValidationMessage.UNAUTHORIZED
	);
};

const errorMiddleware: Middleware =
	({ dispatch }) =>
	(next) =>
	(action) => {
		const result = next(action);

		if (!isRejected(action) || action.meta.aborted || action.meta.condition) {
			return result;
		}

		const error = action.payload ?? action.error;

		if (
			isUnauthorizedError(error) &&
			!AUTH_FORM_ACTION_TYPES.has(action.type)
		) {
			dispatch(authActions.clearUser());

			return result;
		}

		if (!IGNORED_ACTION_TYPES.has(action.type)) {
			notificationService.notify({
				message: getNotificationMessage(normalizeError(error)),
				variant: NotificationVariant.ERROR,
			});
		}

		return result;
	};

export { errorMiddleware };
