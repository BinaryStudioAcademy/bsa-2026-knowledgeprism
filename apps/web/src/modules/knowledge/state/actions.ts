import { DocumentStatus } from "@knowledgeprism/constants";
import {
	type DocumentConfirmUploadResponseDto,
	type DocumentStatusResponseDto,
	type ExtractionItemsResponseDto,
	type ExtractionItemsReviewRequestDto,
	type ExtractionItemsReviewResponseDto,
	type KnowledgeEntryResponseDto,
	type KnowledgeEntryUpdateRequestDto,
	type KnowledgeSearchResponseDto,
	type KnowledgeTreeResponseDto,
	type ManualTextCreateRequestDto,
	type ManualTextResponseDto,
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
import { formatFileSize } from "../libs/helpers/helpers.js";
import { type UploadedDocumentItem } from "../libs/types/types.js";
import { name as sliceName } from "./knowledge.slice.js";

type ConfirmDocumentUploadPayload = {
	documentId: number;
	projectId: string;
};

type ProcessDocumentPayload = {
	documentId?: number | undefined;
	file: File;
	id: string;
	projectId: string;
	uploadUrl?: string | undefined;
};

type ProcessDocumentRejection = {
	documentId?: number | undefined;
	message: string;
	uploadUrl?: string | undefined;
};

type SubmitManualTextPayload = {
	payload: ManualTextCreateRequestDto;
	projectId: string;
};

const confirmDocumentUpload = createAppAsyncThunk<
	DocumentConfirmUploadResponseDto,
	ConfirmDocumentUploadPayload
>(
	`${sliceName}/confirm-document-upload`,
	async ({ documentId, projectId }, { dispatch, extra, signal }) => {
		const response = await extra.documentsApi.confirmUpload({
			documentId,
			projectId,
			signal,
		});

		void dispatch(pollDocumentStatus({ documentId, projectId }));

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
	async ({ payload, projectId }, { dispatch, extra, signal }) => {
		const response = await extra.documentsApi.createManualText({
			payload,
			projectId,
			signal,
		});

		void dispatch(pollDocumentStatus({ documentId: response.id, projectId }));

		return response;
	},
);

const pollDocumentStatus = createAppAsyncThunk<
	DocumentStatusResponseDto,
	{ documentId: number; projectId: string }
>(
	`${sliceName}/poll-document-status`,
	async ({ documentId, projectId }, { dispatch, extra, signal }) => {
		const statusResponse = await extra.documentsApi.getDocumentStatus({
			documentId,
			projectId,
			signal,
		});

		const terminalStatuses: ValueOf<typeof DocumentStatus>[] = [
			DocumentStatus.WAITING_FOR_VALIDATION,
			DocumentStatus.WAITING_FOR_APPROVAL,
			DocumentStatus.COMPLETED,
			DocumentStatus.FAILED,
		];

		if (!terminalStatuses.includes(statusResponse.status)) {
			const timerId = setTimeout(() => {
				void dispatch(pollDocumentStatus({ documentId, projectId }));
			}, POLL_DOCUMENT_STATUS_INTERVAL_MS);

			signal.addEventListener("abort", () => {
				clearTimeout(timerId);
			});
		} else if (
			statusResponse.status === DocumentStatus.WAITING_FOR_VALIDATION
		) {
			await dispatch(fetchExtractionItems({ documentId, projectId })).unwrap();
		}

		return statusResponse;
	},
);

const fetchExtractionItems = createAppAsyncThunk<
	ExtractionItemsResponseDto,
	{ documentId: number; projectId: string }
>(`${sliceName}/fetch-extraction-items`, async (payload, { extra, signal }) => {
	const { documentsApi } = extra;
	return await documentsApi.getExtractionItems({
		documentId: payload.documentId,
		projectId: payload.projectId,
		signal,
	});
});

const submitExtractionReview = createAppAsyncThunk<
	ExtractionItemsReviewResponseDto,
	{
		documentId: number;
		payload: ExtractionItemsReviewRequestDto;
		projectId: string;
	}
>(
	`${sliceName}/submit-extraction-review`,
	async (payload, { extra, signal }) => {
		const { documentsApi } = extra;
		return await documentsApi.submitExtractionReview({
			documentId: payload.documentId,
			payload: payload.payload,
			projectId: payload.projectId,
			signal,
		});
	},
);

const retryDocumentProcessing = createAppAsyncThunk<
	DocumentStatusResponseDto,
	{ documentId: number; projectId: string }
>(
	`${sliceName}/retry-document-processing`,
	async (payload, { extra, signal }) => {
		const { documentsApi } = extra;
		return await documentsApi.retryProcessing({
			documentId: payload.documentId,
			projectId: payload.projectId,
			signal,
		});
	},
);

export {
	confirmDocumentUpload,
	fetchExtractionItems,
	fetchKnowledgeEntry,
	fetchKnowledgeTree,
	pollDocumentStatus,
	processDocument,
	retryDocumentProcessing,
	searchKnowledge,
	submitExtractionReview,
	submitManualText,
	updateKnowledgeEntry,
};
