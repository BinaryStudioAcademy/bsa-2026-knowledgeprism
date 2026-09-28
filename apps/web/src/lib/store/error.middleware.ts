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
	"glossary/create-term/rejected",
	"glossary/update-term/rejected",
	"knowledge/apply-integration-changes/rejected",
	"knowledge/confirm-document-upload/rejected",
	"knowledge/fetch-extraction-items/rejected",
	"knowledge/fetch-integration-changes/rejected",
	"knowledge/poll-document-status/rejected",
	"knowledge/process-document/rejected",
	"knowledge/retry-document-processing/rejected",
	"knowledge/submit-extraction-review/rejected",
	"knowledge/submit-manual-text/rejected",
	"knowledge/update-extraction-item/rejected",
]);

const AUTH_FORM_ACTION_TYPES = new Set([
	"auth/sign-in/rejected",
	"auth/sign-up/rejected",
]);

type PipelineScope = {
	pipelineSessionId: number;
	projectId: string;
};

type RequestIdField =
	| "activeDocumentSwitchRequestId"
	| "entryRequestId"
	| "integrationPreviewRequestId"
	| "pendingReviewRequestId"
	| "searchRequestId"
	| "treeRequestId";

const REQUEST_ID_FIELD_BY_ACTION_TYPE = new Map<string, RequestIdField>([
	["knowledge/fetch-entry/rejected", "entryRequestId"],
	[
		"knowledge/fetch-integration-changes/rejected",
		"integrationPreviewRequestId",
	],
	[
		"knowledge/fetch-pending-review-documents/rejected",
		"pendingReviewRequestId",
	],
	["knowledge/fetch-tree/rejected", "treeRequestId"],
	["knowledge/search-knowledge/rejected", "searchRequestId"],
	[
		"knowledge/switch-active-document/rejected",
		"activeDocumentSwitchRequestId",
	],
]);

const POLL_STATUS_REJECTED_ACTION_TYPE =
	"knowledge/poll-document-status/rejected";
const UPDATE_ENTRY_REJECTED_ACTION_TYPE = "knowledge/update-entry/rejected";

const isRecord = (value: unknown): value is Record<string, unknown> => {
	return typeof value === "object" && value !== null;
};

const getPipelineScope = (action: unknown): null | PipelineScope => {
	if (!isRecord(action) || !isRecord(action["meta"])) {
		return null;
	}

	const argument = action["meta"]["arg"];

	if (!isRecord(argument)) {
		return null;
	}

	const pipelineSessionId = argument["pipelineSessionId"];
	const projectId = argument["projectId"];

	return typeof pipelineSessionId === "number" && typeof projectId === "string"
		? { pipelineSessionId, projectId }
		: null;
};

const isPipelineScopeCurrent = (
	scope: PipelineScope,
	state: unknown,
): boolean => {
	if (!isRecord(state) || !isRecord(state["knowledge"])) {
		return false;
	}

	const knowledge = state["knowledge"];

	return (
		knowledge["pipelineProjectId"] === scope.projectId &&
		knowledge["pipelineSessionId"] === scope.pipelineSessionId
	);
};

const isLatestOwnedRequest = (action: unknown, state: unknown): boolean => {
	if (
		!isRecord(action) ||
		typeof action["type"] !== "string" ||
		!isRecord(action["meta"]) ||
		typeof action["meta"]["requestId"] !== "string"
	) {
		return true;
	}

	const field = REQUEST_ID_FIELD_BY_ACTION_TYPE.get(action["type"]);

	if (
		field === undefined &&
		action["type"] !== POLL_STATUS_REJECTED_ACTION_TYPE &&
		action["type"] !== UPDATE_ENTRY_REJECTED_ACTION_TYPE
	) {
		return true;
	}

	if (!isRecord(state) || !isRecord(state["knowledge"])) {
		return false;
	}

	const knowledge = state["knowledge"];

	if (action["type"] === POLL_STATUS_REJECTED_ACTION_TYPE) {
		const argument = action["meta"]["arg"];
		const statusRequestIds = knowledge["statusRequestIds"];

		if (!isRecord(argument) || !isRecord(statusRequestIds)) {
			return false;
		}

		const documentId = argument["documentId"];

		return (
			typeof documentId === "number" &&
			statusRequestIds[String(documentId)] === action["meta"]["requestId"]
		);
	}

	if (action["type"] === UPDATE_ENTRY_REJECTED_ACTION_TYPE) {
		const argument = action["meta"]["arg"];
		const updateEntryRequestIds = knowledge["updateEntryRequestIds"];

		if (!isRecord(argument) || !isRecord(updateEntryRequestIds)) {
			return false;
		}

		const entryId = argument["entryId"];

		return (
			typeof entryId === "number" &&
			updateEntryRequestIds[String(entryId)] === action["meta"]["requestId"]
		);
	}

	return (
		field === undefined || knowledge[field] === action["meta"]["requestId"]
	);
};

const isUnauthorizedError = (error: unknown): boolean => {
	const { message, status } = normalizeError(error);

	return (
		status === HTTPCode.UNAUTHORIZED ||
		message === AuthValidationMessage.UNAUTHORIZED
	);
};

const errorMiddleware: Middleware = (middlewareApi) => (next) => (action) => {
	const stateBeforeAction: unknown = middlewareApi.getState();
	const result = next(action);

	if (!isRejected(action) || action.meta.aborted || action.meta.condition) {
		return result;
	}

	const error = action.payload ?? action.error;

	if (!isLatestOwnedRequest(action, stateBeforeAction)) {
		return result;
	}

	const pipelineScope = getPipelineScope(action);

	if (
		pipelineScope &&
		!isPipelineScopeCurrent(pipelineScope, middlewareApi.getState())
	) {
		return result;
	}

	if (isUnauthorizedError(error) && !AUTH_FORM_ACTION_TYPES.has(action.type)) {
		middlewareApi.dispatch(authActions.clearUser());

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
