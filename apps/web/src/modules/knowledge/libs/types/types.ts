import { type PartialBlock } from "@blocknote/core";

import { type ValueOf } from "~/lib/types/types.js";

import { type DocumentProcessingStatus } from "../enums/enums.js";

interface KbEntry {
	content: PartialBlock[] | string;
	createdAt?: string;
	id: string;
	title: string;
	updatedAt?: string;
	version: number;
}

type KnowledgeState = {
	errorMessage: null | string;
	processingStatus: ValueOf<typeof DocumentProcessingStatus>;
	selectedFile: null | UploadedDocumentItem;
};

interface UpdateKbEntryPayload {
	content: string;
	title: string;
	version: number;
}

type UploadedDocumentItem = {
	id: string;
	name: string;
	progress: number;
	size: number;
	sizeLabel: string;
	status: ValueOf<typeof DocumentProcessingStatus>;
};

export {
	type KbEntry,
	type KnowledgeState,
	type UpdateKbEntryPayload,
	type UploadedDocumentItem,
};
