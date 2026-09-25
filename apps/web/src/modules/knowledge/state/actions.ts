import { DocumentStatus } from "@knowledgeprism/constants";
import {
	type DocumentConfirmUploadResponseDto,
	type DocumentStatusResponseDto,
	type IntegrationChangesApplyRequestDto,
	type IntegrationChangesResponseDto,
	type KnowledgeEntryResponseDto,
	type KnowledgeEntryUpdateRequestDto,
	type KnowledgeSearchResponseDto,
	type KnowledgeTreeResponseDto,
	type ManualTextCreateRequestDto,
	type ManualTextResponseDto,
} from "@knowledgeprism/types";
import { createAsyncThunk } from "@reduxjs/toolkit";

import { createAppAsyncThunk } from "~/lib/store/store.module.js";
import { type AsyncThunkConfig } from "~/lib/types/types.js";

import { DocumentValidationMessage } from "../libs/constants/constants.js";
import { DocumentProcessingStatus } from "../libs/enums/enums.js";
import { formatFileSize, getFileContentType } from "../libs/helpers/helpers.js";
import { type UploadedDocumentItem } from "../libs/types/types.js";
import { name as sliceName } from "./knowledge.slice.js";

type ApplyIntegrationChangesPayload = {
	documentId: number;
	payload: IntegrationChangesApplyRequestDto;
	projectId: string;
};

type ConfirmDocumentUploadPayload = {
	documentId: number;
	projectId: string;
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
	({ documentId, projectId }, { extra, signal }) => {
		return extra.documentsApi.confirmUpload({
			documentId,
			projectId,
			signal,
		});
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
						contentType: getFileContentType(file),
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
	async ({ documentId, payload, projectId }, { dispatch, extra, signal }) => {
		const document = await extra.documentsApi.applyIntegrationChanges({
			documentId,
			payload,
			projectId,
			signal,
		});

		void dispatch(fetchKnowledgeTree({ projectId }));

		return document;
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
	({ payload, projectId }, { extra, signal }) => {
		return extra.documentsApi.createManualText({
			payload,
			projectId,
			signal,
		});
	},
);

export {
	applyIntegrationChanges,
	confirmDocumentUpload,
	fetchIntegrationChanges,
	fetchKnowledgeEntry,
	fetchKnowledgeTree,
	processDocument,
	searchKnowledge,
	submitManualText,
	updateKnowledgeEntry,
};
