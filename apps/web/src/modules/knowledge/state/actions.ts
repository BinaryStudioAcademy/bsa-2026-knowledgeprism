import { createAsyncThunk } from "@reduxjs/toolkit";

import { config } from "~/lib/config/config.js";
import { AppEnvironment } from "~/lib/enums/enums.js";
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
	isRetry?: boolean;
	name: string;
	size: number;
};

const FAILURE_KEYWORDS = ["fail", "error"] as const;

const processDocument = createAsyncThunk<
	UploadedDocumentItem,
	ProcessDocumentPayload,
	AsyncThunkConfig
>(
	`${sliceName}/process-document`,
	async ({ id, isRetry = false, name, size }) => {
		const isDevelopment =
			config.ENV.APP.ENVIRONMENT === AppEnvironment.DEVELOPMENT;

		if (!isDevelopment) {
			throw new Error(DocumentValidationMessage.PROCESSING_FAILED);
		}

		await new Promise<void>((resolve) => {
			setTimeout(() => {
				resolve();
			}, MOCK_PROCESSING_DELAY_MS);
		});

		const hasFailureKeyword =
			!isRetry &&
			FAILURE_KEYWORDS.some((keyword) => name.toLowerCase().includes(keyword));

		if (hasFailureKeyword) {
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
	},
);

export { processDocument };
