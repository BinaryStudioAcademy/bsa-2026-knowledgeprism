import { createAsyncThunk } from "@reduxjs/toolkit";

import { type AsyncThunkConfig } from "~/lib/types/types.js";

import { TEMPORARY_PROJECT_ID } from "../libs/constants/constants.js";
import { DocumentProcessingStatus } from "../libs/enums/enums.js";
import { formatFileSize } from "../libs/helpers/helpers.js";
import { type UploadedDocumentItem } from "../libs/types/types.js";
import { name as sliceName } from "./knowledge.slice.js";

type ProcessDocumentPayload = {
	documentId?: number | undefined;
	file: File;
	id: string;
	uploadUrl?: string | undefined;
};

type ProcessDocumentRejection = {
	documentId?: number | undefined;
	message: string;
	uploadUrl?: string | undefined;
};

const processDocument = createAsyncThunk<
	UploadedDocumentItem,
	ProcessDocumentPayload,
	AsyncThunkConfig & { rejectValue: ProcessDocumentRejection }
>(
	`${sliceName}/process-document`,
	async ({ documentId, file, id, uploadUrl }, { extra, rejectWithValue }) => {
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
					projectId: TEMPORARY_PROJECT_ID,
				});
				resolvedDocumentId = intent.documentId;
				resolvedUploadUrl = intent.uploadUrl;
			}

			await documentsApi.uploadFileToStorage({
				file,
				uploadUrl: resolvedUploadUrl,
			});

			await documentsApi.confirmUpload({
				documentId: resolvedDocumentId,
				projectId: TEMPORARY_PROJECT_ID,
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

export { processDocument };
