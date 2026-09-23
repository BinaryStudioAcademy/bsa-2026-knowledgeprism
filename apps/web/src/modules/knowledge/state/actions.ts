import {
	type KnowledgeEntryResponseDto,
	type KnowledgeEntryUpdateRequestDto,
	type KnowledgeSearchResponseDto,
	type KnowledgeTreeResponseDto,
} from "@knowledgeprism/types";
import { createAsyncThunk } from "@reduxjs/toolkit";

import { type AsyncThunkConfig } from "~/lib/types/types.js";

import { DocumentProcessingStatus } from "../libs/enums/enums.js";
import { formatFileSize } from "../libs/helpers/helpers.js";
import { type UploadedDocumentItem } from "../libs/types/types.js";
import { name as sliceName } from "./knowledge.slice.js";

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
						contentType: file.type,
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

			await documentsApi.confirmUpload({
				documentId: resolvedDocumentId,
				projectId,
				signal,
			});
		} catch (error) {
			return rejectWithValue({
				documentId: resolvedDocumentId,
				message: error instanceof Error ? error.message : "Processing failed",
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
			status: DocumentProcessingStatus.SUCCESS,
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

export {
	fetchKnowledgeEntry,
	fetchKnowledgeTree,
	processDocument,
	searchKnowledge,
	updateKnowledgeEntry,
};
