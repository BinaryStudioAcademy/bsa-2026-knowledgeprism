import { DocumentStatus } from "@knowledgeprism/constants";
import {
	type DocumentConfirmUploadResponseDto,
	type DocumentStatusResponseDto,
	type ExtractionItemResponseDto,
	type ExtractionItemsResponseDto,
	type ExtractionItemsReviewRequestDto,
	type ExtractionItemsReviewResponseDto,
	type IntegrationChangesApplyRequestDto,
	type IntegrationChangesResponseDto,
	type KnowledgeEntryResponseDto,
	type KnowledgeEntryUpdateRequestDto,
	type KnowledgeSearchResponseDto,
	type KnowledgeTreeResponseDto,
	type ManualTextCreateRequestDto,
	type ManualTextResponseDto,
	type PendingReviewDocumentsResponseDto,
} from "@knowledgeprism/types";
import { createAsyncThunk } from "@reduxjs/toolkit";

import { createAppAsyncThunk } from "~/lib/store/store.module.js";
import { type AsyncThunkConfig, type ValueOf } from "~/lib/types/types.js";

import {
	DocumentValidationMessage,
	PDF_MIME_TYPE,
	POLL_DOCUMENT_STATUS_INTERVAL_MS,
} from "../libs/constants/constants.js";
import { DocumentProcessingStatus } from "../libs/enums/enums.js";
import {
	addTrackedDocumentId,
	formatFileSize,
	isMatchingPipelineSession,
	readTrackedDocumentIds,
} from "../libs/helpers/helpers.js";
import {
	type PipelineSessionScope,
	type UploadedDocumentItem,
} from "../libs/types/types.js";
import { clearPollTimer, schedulePollTimer } from "./document-poll-timers.js";
import {
	name as sliceName,
	actions as sliceSyncActions,
} from "./knowledge.slice.js";

type ApplyIntegrationChangesPayload = DocumentPipelineRequest & {
	payload: IntegrationChangesApplyRequestDto;
};

type ConfirmDocumentUploadPayload = {
	documentId: number;
	label?: string | undefined;
	projectId: string;
	uploadSessionId: number;
};

type DocumentPipelineRequest = PipelineSessionScope & {
	documentId: number;
};

type FetchIntegrationChangesPayload = {
	documentId: number;
	projectId: string;
};

type ProcessDocumentPayload = {
	documentId?: number | undefined;
	file: File;
	id: string;
	projectId: string;
	uploadSessionId: number;
	uploadUrl?: string | undefined;
};

type ProcessDocumentRejection = {
	documentId?: number | undefined;
	message: string;
	uploadUrl?: string | undefined;
};

type ReviewableDocumentStatus =
	| typeof DocumentStatus.WAITING_FOR_APPROVAL
	| typeof DocumentStatus.WAITING_FOR_VALIDATION;

type SubmitManualTextPayload = {
	payload: ManualTextCreateRequestDto;
	projectId: string;
	uploadSessionId: number;
};

type UpdateExtractionItemPayload = DocumentPipelineRequest & {
	extractionItemId: number;
	payload: { text: string; title: string };
};

const isReviewableDocumentStatus = (
	status: ValueOf<typeof DocumentStatus>,
): status is ReviewableDocumentStatus => {
	return (
		status === DocumentStatus.WAITING_FOR_VALIDATION ||
		status === DocumentStatus.WAITING_FOR_APPROVAL
	);
};

const isTrackedDocumentRequestCurrent = (
	request: DocumentPipelineRequest,
	state: AsyncThunkConfig["state"],
): boolean => {
	return (
		isMatchingPipelineSession(state.knowledge, request) &&
		state.knowledge.trackedDocuments.some(
			(document) => document.documentId === request.documentId,
		)
	);
};

const confirmDocumentUpload = createAppAsyncThunk<
	DocumentConfirmUploadResponseDto,
	ConfirmDocumentUploadPayload
>(
	`${sliceName}/confirm-document-upload`,
	async (
		{ documentId, label, projectId, uploadSessionId },
		{ dispatch, extra, getState, signal },
	) => {
		const response = await extra.documentsApi.confirmUpload({
			documentId,
			projectId,
			signal,
		});

		if (getState().knowledge.uploadSession?.id === uploadSessionId) {
			addTrackedDocumentId(projectId, documentId);
			dispatch(
				sliceSyncActions.trackDocument({
					documentId,
					label: label ?? `Document ${String(documentId)}`,
					projectId,
				}),
			);

			void dispatch(
				pollDocumentStatus({
					documentId,
					pipelineSessionId: getState().knowledge.pipelineSessionId,
					projectId,
				}),
			);
		}

		return response;
	},
);

const searchKnowledge = createAsyncThunk<
	KnowledgeSearchResponseDto,
	{ projectId: string; query: string },
	AsyncThunkConfig
>(
	`${sliceName}/search-knowledge`,
	async ({ projectId, query }, { extra, signal }) => {
		return await extra.knowledgeApi.search({ projectId, query, signal });
	},
);

const processDocument = createAsyncThunk<
	UploadedDocumentItem,
	ProcessDocumentPayload,
	AsyncThunkConfig & { rejectValue: ProcessDocumentRejection }
>(
	`${sliceName}/process-document`,
	async (
		{ documentId, file, id, projectId, uploadUrl },
		{ extra, rejectWithValue, signal },
	) => {
		const { documentsApi } = extra;

		let resolvedDocumentId = documentId;
		let resolvedUploadUrl = uploadUrl;

		try {
			if (!resolvedDocumentId || !resolvedUploadUrl) {
				const intent = await documentsApi.createUploadIntent({
					payload: {
						contentType: file.type || PDF_MIME_TYPE,
						fileName: file.name,
						sizeInBytes: file.size,
					},
					projectId,
					signal,
				});
				resolvedDocumentId = intent.documentId;
				resolvedUploadUrl = intent.uploadUrl;
			}

			await documentsApi.uploadFileToStorage({
				file,
				signal,
				uploadUrl: resolvedUploadUrl,
			});
		} catch (error) {
			return rejectWithValue({
				documentId: resolvedDocumentId,
				message:
					error instanceof Error
						? error.message
						: DocumentValidationMessage.PROCESSING_FAILED,
				uploadUrl: resolvedUploadUrl,
			});
		}

		return {
			documentId: resolvedDocumentId,
			id,
			name: file.name,
			progress: 100,
			size: file.size,
			sizeLabel: formatFileSize(file.size),
			status: DocumentProcessingStatus.READY,
			uploadUrl: resolvedUploadUrl,
		};
	},
);

const fetchIntegrationChanges = createAppAsyncThunk<
	IntegrationChangesResponseDto,
	FetchIntegrationChangesPayload
>(
	`${sliceName}/fetch-integration-changes`,
	async ({ documentId, projectId }, { extra, rejectWithValue, signal }) => {
		const documentStatus = await extra.documentsApi.getDocumentStatus({
			documentId,
			projectId,
			signal,
		});

		if (documentStatus.status === DocumentStatus.INTEGRATING) {
			return rejectWithValue(
				"Integration analysis is still running. Try again in a moment.",
			);
		}

		if (documentStatus.status !== DocumentStatus.WAITING_FOR_APPROVAL) {
			return rejectWithValue(
				"Integration preview is available when the document is waiting for approval.",
			);
		}

		return await extra.documentsApi.getIntegrationChanges({
			documentId,
			projectId,
			signal,
		});
	},
);

const fetchKnowledgeTree = createAsyncThunk<
	KnowledgeTreeResponseDto,
	{ projectId: string },
	AsyncThunkConfig
>(`${sliceName}/fetch-tree`, async (payload, { extra }) => {
	const { knowledgeApi } = extra;
	return await knowledgeApi.getKnowledgeTree({
		projectId: payload.projectId,
	});
});

const applyIntegrationChanges = createAppAsyncThunk<
	DocumentStatusResponseDto,
	ApplyIntegrationChangesPayload
>(
	`${sliceName}/apply-integration-changes`,
	async (request, { dispatch, extra, getState, signal }) => {
		const { documentId, payload, projectId } = request;

		try {
			return await extra.documentsApi.applyIntegrationChanges({
				documentId,
				payload,
				projectId,
				signal,
			});
		} catch (error) {
			if (
				!signal.aborted &&
				isTrackedDocumentRequestCurrent(request, getState())
			) {
				const reconciliation = await dispatch(pollDocumentStatus(request));

				if (
					pollDocumentStatus.fulfilled.match(reconciliation) &&
					reconciliation.payload.status === DocumentStatus.COMPLETED &&
					isMatchingPipelineSession(getState().knowledge, request)
				) {
					void dispatch(fetchKnowledgeTree({ projectId }));
				}
			}

			throw error;
		}
	},
	{
		condition: (request, { getState }) =>
			isTrackedDocumentRequestCurrent(request, getState()),
	},
);

const fetchKnowledgeEntry = createAsyncThunk<
	KnowledgeEntryResponseDto,
	{ entryId: number; projectId: string },
	AsyncThunkConfig
>(`${sliceName}/fetch-entry`, async (payload, { extra }) => {
	const { knowledgeApi } = extra;
	return await knowledgeApi.getKnowledgeEntry({
		entryId: payload.entryId,
		projectId: payload.projectId,
	});
});

const updateKnowledgeEntry = createAsyncThunk<
	KnowledgeEntryResponseDto,
	{
		entryId: number;
		payload: KnowledgeEntryUpdateRequestDto;
		projectId: string;
	},
	AsyncThunkConfig
>(`${sliceName}/update-entry`, async (payload, { extra }) => {
	const { knowledgeApi } = extra;
	return await knowledgeApi.updateKnowledgeEntry({
		entryId: payload.entryId,
		payload: payload.payload,
		projectId: payload.projectId,
	});
});

const submitManualText = createAsyncThunk<
	ManualTextResponseDto,
	SubmitManualTextPayload,
	AsyncThunkConfig
>(
	`${sliceName}/submit-manual-text`,
	async (
		{ payload, projectId, uploadSessionId },
		{ dispatch, extra, getState, signal },
	) => {
		const response = await extra.documentsApi.createManualText({
			payload,
			projectId,
			signal,
		});

		if (getState().knowledge.uploadSession?.id !== uploadSessionId) {
			return response;
		}

		const label = payload.title?.trim() || "Manual text";

		addTrackedDocumentId(projectId, response.id);
		dispatch(
			sliceSyncActions.trackDocument({
				documentId: response.id,
				label,
				projectId,
			}),
		);

		void dispatch(
			pollDocumentStatus({
				documentId: response.id,
				pipelineSessionId: getState().knowledge.pipelineSessionId,
				projectId,
			}),
		);

		return response;
	},
);

type ScheduleNextPollParameters = {
	dispatch: (action: ReturnType<typeof pollDocumentStatus>) => void;
	request: DocumentPipelineRequest;
	signal: AbortSignal;
};

const scheduleNextPoll = ({
	dispatch,
	request,
	signal,
}: ScheduleNextPollParameters): void => {
	const timerId = setTimeout(() => {
		dispatch(pollDocumentStatus(request));
	}, POLL_DOCUMENT_STATUS_INTERVAL_MS);

	schedulePollTimer(request.documentId, timerId);

	signal.addEventListener("abort", () => {
		clearPollTimer(request.documentId);
	});
};

const pollDocumentStatus = createAppAsyncThunk<
	DocumentStatusResponseDto,
	DocumentPipelineRequest
>(
	`${sliceName}/poll-document-status`,
	async (request, { dispatch, extra, getState, signal }) => {
		const { documentId, projectId } = request;
		const isRequestCurrent = (): boolean =>
			isTrackedDocumentRequestCurrent(request, getState());

		try {
			const statusResponse = await extra.documentsApi.getDocumentStatus({
				documentId,
				projectId,
				signal,
			});

			if (!isRequestCurrent()) {
				return statusResponse;
			}

			const terminalStatuses: ValueOf<typeof DocumentStatus>[] = [
				DocumentStatus.WAITING_FOR_VALIDATION,
				DocumentStatus.WAITING_FOR_APPROVAL,
				DocumentStatus.CANCELLED,
				DocumentStatus.COMPLETED,
				DocumentStatus.FAILED,
			];

			if (terminalStatuses.includes(statusResponse.status)) {
				clearPollTimer(documentId);
			} else {
				scheduleNextPoll({ dispatch, request, signal });
			}

			return statusResponse;
		} catch (error) {
			if (!signal.aborted && isRequestCurrent()) {
				scheduleNextPoll({ dispatch, request, signal });
			}

			throw error;
		}
	},
	{
		condition: (request, { getState }) =>
			isTrackedDocumentRequestCurrent(request, getState()),
	},
);

const fetchPendingReviewDocuments = createAppAsyncThunk<
	PendingReviewDocumentsResponseDto,
	PipelineSessionScope
>(
	`${sliceName}/fetch-pending-review-documents`,
	async (scope, { dispatch, extra, getState, signal }) => {
		const response = await extra.documentsApi.getPendingReviewDocuments({
			projectId: scope.projectId,
			signal,
		});

		if (isMatchingPipelineSession(getState().knowledge, scope)) {
			const pendingDocumentIds = new Set(
				response.items.map((document) => document.id),
			);
			const missingReviewDocumentIds = getState()
				.knowledge.trackedDocuments.filter(
					(document) =>
						(document.status === DocumentStatus.WAITING_FOR_VALIDATION ||
							document.status === DocumentStatus.WAITING_FOR_APPROVAL) &&
						!pendingDocumentIds.has(document.documentId),
				)
				.map((document) => document.documentId);

			await Promise.all(
				missingReviewDocumentIds.map((documentId) =>
					dispatch(pollDocumentStatus({ ...scope, documentId })),
				),
			);
		}

		return response;
	},
	{
		condition: (scope, { getState }) =>
			isMatchingPipelineSession(getState().knowledge, scope),
	},
);

const fetchExtractionItems = createAppAsyncThunk<
	ExtractionItemsResponseDto,
	DocumentPipelineRequest
>(
	`${sliceName}/fetch-extraction-items`,
	async (payload, { extra, signal }) => {
		const { documentsApi } = extra;
		return await documentsApi.getExtractionItems({
			documentId: payload.documentId,
			projectId: payload.projectId,
			signal,
		});
	},
	{
		condition: (request, { getState }) =>
			isTrackedDocumentRequestCurrent(request, getState()),
	},
);

const updateExtractionItem = createAppAsyncThunk<
	ExtractionItemResponseDto,
	UpdateExtractionItemPayload
>(
	`${sliceName}/update-extraction-item`,
	async (request, { dispatch, extra, getState, signal }) => {
		const { documentsApi } = extra;

		try {
			return await documentsApi.updateExtractionItem({
				documentId: request.documentId,
				extractionItemId: request.extractionItemId,
				payload: request.payload,
				projectId: request.projectId,
				signal,
			});
		} catch (error) {
			if (
				!signal.aborted &&
				isTrackedDocumentRequestCurrent(request, getState())
			) {
				const reconciliation = await dispatch(pollDocumentStatus(request));

				if (
					pollDocumentStatus.fulfilled.match(reconciliation) &&
					reconciliation.payload.status === DocumentStatus.COMPLETED &&
					isMatchingPipelineSession(getState().knowledge, request)
				) {
					void dispatch(fetchKnowledgeTree({ projectId: request.projectId }));
				}
			}

			throw error;
		}
	},
	{
		condition: (request, { getState }) =>
			isTrackedDocumentRequestCurrent(request, getState()),
	},
);

const initializeProjectKnowledgePipeline = createAppAsyncThunk<
	boolean,
	{ projectId: string }
>(
	`${sliceName}/initialize-project-knowledge-pipeline`,
	async ({ projectId }, { dispatch, getState }) => {
		const scope: PipelineSessionScope = {
			pipelineSessionId: getState().knowledge.pipelineSessionId,
			projectId,
		};

		await dispatch(fetchPendingReviewDocuments(scope));

		if (!isMatchingPipelineSession(getState().knowledge, scope)) {
			return false;
		}

		const documentIds = readTrackedDocumentIds(projectId);

		for (const documentId of documentIds) {
			dispatch(
				sliceSyncActions.trackDocument({
					documentId,
					label: `Document ${String(documentId)}`,
					projectId,
				}),
			);
		}

		await Promise.all(
			documentIds.map((documentId) =>
				dispatch(pollDocumentStatus({ ...scope, documentId })),
			),
		);

		return true;
	},
);

const resumeNextPendingReview = createAppAsyncThunk<
	{ openPreview: boolean },
	{ projectId: string }
>(
	`${sliceName}/resume-next-pending-review`,
	async ({ projectId }, { dispatch, getState }) => {
		const scope: PipelineSessionScope = {
			pipelineSessionId: getState().knowledge.pipelineSessionId,
			projectId,
		};
		const isSessionCurrent = (): boolean =>
			isMatchingPipelineSession(getState().knowledge, scope);

		try {
			await dispatch(fetchPendingReviewDocuments(scope)).unwrap();
		} catch {
			// Fall back to the locally tracked documents.
		}

		if (!isSessionCurrent()) {
			return { openPreview: false };
		}

		const { activeDocumentId: documentId, activeDocumentStatus: status } =
			getState().knowledge;

		if (documentId === null) {
			return { openPreview: false };
		}

		if (status === DocumentStatus.WAITING_FOR_VALIDATION) {
			try {
				await dispatch(fetchExtractionItems({ ...scope, documentId })).unwrap();
			} catch {
				return { openPreview: false };
			}

			const state = getState().knowledge;

			return {
				openPreview:
					isSessionCurrent() &&
					state.activeDocumentId === documentId &&
					state.activeDocumentStatus ===
						DocumentStatus.WAITING_FOR_VALIDATION &&
					state.extractionItemsDocumentId === documentId,
			};
		}

		if (status === DocumentStatus.WAITING_FOR_APPROVAL) {
			const state = getState().knowledge;

			return {
				openPreview:
					isSessionCurrent() &&
					state.activeDocumentId === documentId &&
					state.activeDocumentStatus === DocumentStatus.WAITING_FOR_APPROVAL,
			};
		}

		return { openPreview: false };
	},
);

const switchActiveDocument = createAppAsyncThunk<
	boolean,
	DocumentPipelineRequest
>(
	`${sliceName}/switch-active-document`,
	async (request, { dispatch, extra, getState, signal }) => {
		const { documentId, projectId } = request;
		const isSessionCurrent = (): boolean =>
			isTrackedDocumentRequestCurrent(request, getState());

		if (!isSessionCurrent()) {
			return false;
		}

		const statusResponse = await extra.documentsApi.getDocumentStatus({
			documentId,
			projectId,
			signal,
		});

		if (!isSessionCurrent()) {
			return false;
		}

		if (!isReviewableDocumentStatus(statusResponse.status)) {
			dispatch(
				sliceSyncActions.syncTrackedDocumentStatus({
					...request,
					status: statusResponse.status,
				}),
			);

			if (
				statusResponse.status !== DocumentStatus.CANCELLED &&
				statusResponse.status !== DocumentStatus.COMPLETED &&
				statusResponse.status !== DocumentStatus.FAILED
			) {
				void dispatch(pollDocumentStatus(request));
			}

			return false;
		}

		let extractionItems: ExtractionItemResponseDto[] = [];

		if (statusResponse.status === DocumentStatus.WAITING_FOR_VALIDATION) {
			const extractionResponse = await extra.documentsApi.getExtractionItems({
				documentId,
				projectId,
				signal,
			});
			extractionItems = extractionResponse.items;
		}

		if (!isSessionCurrent()) {
			return false;
		}

		dispatch(
			sliceSyncActions.activatePreparedReviewDocument({
				...request,
				extractionItems,
				status: statusResponse.status,
			}),
		);

		return true;
	},
	{
		condition: (request, { getState }) =>
			isTrackedDocumentRequestCurrent(request, getState()),
	},
);

const submitExtractionReview = createAppAsyncThunk<
	ExtractionItemsReviewResponseDto,
	DocumentPipelineRequest & {
		payload: ExtractionItemsReviewRequestDto;
	}
>(
	`${sliceName}/submit-extraction-review`,
	async (payload, { dispatch, extra, getState, signal }) => {
		const { documentsApi } = extra;

		try {
			return await documentsApi.submitExtractionReview({
				documentId: payload.documentId,
				payload: payload.payload,
				projectId: payload.projectId,
				signal,
			});
		} catch (error) {
			if (
				!signal.aborted &&
				isTrackedDocumentRequestCurrent(payload, getState())
			) {
				const reconciliation = await dispatch(pollDocumentStatus(payload));

				if (
					pollDocumentStatus.fulfilled.match(reconciliation) &&
					reconciliation.payload.status === DocumentStatus.COMPLETED &&
					isMatchingPipelineSession(getState().knowledge, payload)
				) {
					void dispatch(fetchKnowledgeTree({ projectId: payload.projectId }));
				}
			}

			throw error;
		}
	},
	{
		condition: (request, { getState }) =>
			isTrackedDocumentRequestCurrent(request, getState()),
	},
);

const retryDocumentProcessing = createAppAsyncThunk<
	DocumentStatusResponseDto,
	DocumentPipelineRequest
>(
	`${sliceName}/retry-document-processing`,
	async (payload, { dispatch, extra, getState, signal }) => {
		const { documentsApi } = extra;

		try {
			return await documentsApi.retryProcessing({
				documentId: payload.documentId,
				projectId: payload.projectId,
				signal,
			});
		} catch (error) {
			if (
				!signal.aborted &&
				isTrackedDocumentRequestCurrent(payload, getState())
			) {
				await dispatch(pollDocumentStatus(payload));
			}

			throw error;
		}
	},
	{
		condition: (request, { getState }) =>
			isTrackedDocumentRequestCurrent(request, getState()),
	},
);

export {
	applyIntegrationChanges,
	confirmDocumentUpload,
	fetchExtractionItems,
	fetchIntegrationChanges,
	fetchKnowledgeEntry,
	fetchKnowledgeTree,
	fetchPendingReviewDocuments,
	initializeProjectKnowledgePipeline,
	pollDocumentStatus,
	processDocument,
	resumeNextPendingReview,
	retryDocumentProcessing,
	searchKnowledge,
	submitExtractionReview,
	submitManualText,
	switchActiveDocument,
	updateExtractionItem,
	updateKnowledgeEntry,
};
