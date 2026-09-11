import { createAsyncThunk } from "@reduxjs/toolkit";

import { type AsyncThunkConfig } from "~/lib/types/types.js";

import {
	DocumentValidationMessage,
	MOCK_PROCESSING_DELAY_MS,
} from "../libs/constants/constants.js";
import { DocumentProcessingStatus } from "../libs/enums/enums.js";
import { formatFileSize } from "../libs/helpers/helpers.js";
import { type UploadedDocumentItem } from "../libs/types/types.js";
import { name as sliceName } from "./knowledge.slice.js";

type ProcessDocumentPayload = {
	id: string;
	name: string;
	size: number;
};

const processDocument = createAsyncThunk<
	UploadedDocumentItem,
	ProcessDocumentPayload,
	AsyncThunkConfig
>(`${sliceName}/process-document`, async ({ id, name, size }) => {
	await new Promise<void>((resolve) => {
		setTimeout(() => {
			resolve();
		}, MOCK_PROCESSING_DELAY_MS);
	});

	if (
		name.toLowerCase().includes("fail") ||
		name.toLowerCase().includes("error")
	) {
		throw new Error(DocumentValidationMessage.PROCESSING_FAILED);
	}

	return {
		id,
		name,
		progress: 100,
		size,
		sizeLabel: formatFileSize(size),
		status: DocumentProcessingStatus.SUCCESS,
	};
});

export { processDocument };
