import { type PartialBlock } from "@blocknote/core";

import { type ValueOf } from "~/lib/types/types.js";

import { type DocumentProcessingStatus } from "../enums/enums.js";

interface KbEntry {
	contentJson: PartialBlock[] | Record<string, unknown>[];
	createdAt?: string;
	id: number;
	title: string;
	updatedAt?: string;
}

type KnowledgeState = {
	errorMessage: null | string;
	isAddingKnowledge: boolean;
	processingStatus: ValueOf<typeof DocumentProcessingStatus>;
	selectedFile: null | UploadedDocumentItem;
};

type UploadedDocumentItem = {
	documentId?: number | undefined;
	id: string;
	name: string;
	progress: number;
	size: number;
	sizeLabel: string;
	status: ValueOf<typeof DocumentProcessingStatus>;
	uploadUrl?: string | undefined;
};

export { type KnowledgeEntryUpdateRequestDto } from "@knowledgeprism/types";
export { type KbEntry, type KnowledgeState, type UploadedDocumentItem };
