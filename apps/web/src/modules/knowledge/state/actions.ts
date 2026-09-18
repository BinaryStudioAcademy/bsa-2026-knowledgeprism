import { createAsyncThunk } from "@reduxjs/toolkit";

import { type AsyncThunkConfig } from "~/lib/types/types.js";

import { TEMPORARY_PROJECT_ID } from "../libs/constants/constants.js";
import { DocumentProcessingStatus } from "../libs/enums/enums.js";
import { formatFileSize } from "../libs/helpers/helpers.js";
import { type UploadedDocumentItem } from "../libs/types/types.js";
import { name as sliceName } from "./knowledge.slice.js";

type ProcessDocumentPayload = {
	file: File;
	id: string;
};

const processDocument = createAsyncThunk<
	UploadedDocumentItem,
	ProcessDocumentPayload,
	AsyncThunkConfig
>(`${sliceName}/process-document`, async ({ file, id }, { extra }) => {
	const { documentsApi } = extra;

	const { documentId, uploadUrl } = await documentsApi.createUploadIntent({
		payload: {
			contentType: "application/pdf",
			fileName: file.name,
			sizeInBytes: file.size,
		},
		projectId: TEMPORARY_PROJECT_ID,
	});

	await documentsApi.uploadFileToStorage({ file, uploadUrl });

	await documentsApi.confirmUpload({
		documentId,
		projectId: TEMPORARY_PROJECT_ID,
	});

	return {
		id,
		name: file.name,
		progress: 100,
		size: file.size,
		sizeLabel: formatFileSize(file.size),
		status: DocumentProcessingStatus.SUCCESS,
	};
});

export { processDocument };
