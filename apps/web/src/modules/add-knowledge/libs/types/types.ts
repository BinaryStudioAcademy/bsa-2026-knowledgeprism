import { type ValueOf } from "~/lib/types/types.js";

import { type DocumentProcessingStatus } from "../enums/enums.js";

type AddKnowledgeState = {
	errorMessage: null | string;
	processingStatus: ValueOf<typeof DocumentProcessingStatus>;
	selectedFile: null | UploadedDocumentItem;
};

type UploadedDocumentItem = {
	id: string;
	name: string;
	progress: number;
	size: number;
	sizeLabel: string;
	status: ValueOf<typeof DocumentProcessingStatus>;
};

export { type AddKnowledgeState, type UploadedDocumentItem };
