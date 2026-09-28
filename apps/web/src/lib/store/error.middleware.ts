import { AuthValidationMessage } from "@knowledgeprism/constants";
import { isRejected, type Middleware } from "@reduxjs/toolkit";

import { errorService } from "~/lib/errors/error.service.js";
import { normalizeError } from "~/lib/helpers/normalize-error.helper.js";
import { HTTPCode } from "~/lib/http/http.js";
import { actions as authActions } from "~/modules/auth/auth.js";

const IGNORED_ACTION_TYPES = new Set([
	"askPrism/ask-question/rejected",
	"askPrism/load-suggested-questions/rejected",
	"auth/load-current-user/rejected",
	"knowledge/confirm-document-upload/rejected",
	"knowledge/fetch-integration-changes/rejected",
	"knowledge/poll-document-status/rejected",
	"knowledge/process-document/rejected",
	"knowledge/submit-manual-text/rejected",
]);

const AUTH_FORM_ACTION_TYPES = new Set([
	"auth/sign-in/rejected",
	"auth/sign-up/rejected",
]);

type PipelineScope = {
	pipelineSessionId: number;
	projectId: string;
};

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

const isUnauthorizedError = (error: unknown): boolean => {
	const { message, status } = normalizeError(error);

	return (
		status === HTTPCode.UNAUTHORIZED ||
		message === AuthValidationMessage.UNAUTHORIZED
	);
};

const errorMiddleware: Middleware = (middlewareApi) => (next) => (action) => {
	const result = next(action);

	if (!isRejected(action) || action.meta.aborted || action.meta.condition) {
		return result;
	}

	const error = action.payload ?? action.error;

	if (isUnauthorizedError(error) && !AUTH_FORM_ACTION_TYPES.has(action.type)) {
		middlewareApi.dispatch(authActions.clearUser());

		return result;
	}

	const pipelineScope = getPipelineScope(action);

	if (
		pipelineScope &&
		!isPipelineScopeCurrent(pipelineScope, middlewareApi.getState())
	) {
		return result;
	}

	if (!IGNORED_ACTION_TYPES.has(action.type)) {
		errorService.notify(error);
	}

	return result;
};

export { errorMiddleware };
