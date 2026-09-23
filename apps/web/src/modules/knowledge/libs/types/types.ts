import { type PartialBlock } from "@blocknote/core";
import {
	type KnowledgeEntryResponseDto,
	type KnowledgeSearchItemDto,
	type KnowledgeTreeItemResponseDto,
} from "@knowledgeprism/types";

import { type ValueOf } from "~/lib/types/types.js";

import {
	type DocumentProcessingStatus,
	type SearchStatus,
} from "../enums/enums.js";

type ChangeStatus = "created" | "modified" | "updated";

type ConflictResolution = "keep" | "use-new";

type FieldConflict = {
	currentValue: string;
	field: "content" | "title";
	id: string;
	incomingValue: string;
	resolution?: ConflictResolution;
};

type IntegrationPreviewProperties = {
	baselineVersion?: number;
	currentLiveVersion?: number;
	isInitialCreation?: boolean;
	onAddMore: () => void;
	onApprove: (pages: ProposedPage[]) => void;
	onClose: () => void;
	proposedStructure?: ProposedPage[];
};

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
	isEntryLoading: boolean;
	isTreeLoading: boolean;
	processingStatus: ValueOf<typeof DocumentProcessingStatus>;
	searchErrorMessage: null | string;
	searchQuery: string;
	searchResults: KnowledgeSearchItemDto[];
	searchStatus: ValueOf<typeof SearchStatus>;
	selectedEntry: KnowledgeEntryResponseDto | null;
	selectedFile: null | UploadedDocumentItem;
	tree: KnowledgeTreeItemResponseDto[];
};

type ProposedPage = {
	id: string;
	sections: ProposedSection[];
	status: ChangeStatus;
	title: string;
};

type ProposedSection = {
	conflicts?: FieldConflict[];
	content: string;
	id: string;
	originalContent?: string;
	status: ChangeStatus;
	summary?: string;
	title: string;
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
export {
	type ChangeStatus,
	type ConflictResolution,
	type FieldConflict,
	type IntegrationPreviewProperties,
	type KbEntry,
	type KnowledgeState,
	type ProposedPage,
	type ProposedSection,
	type UploadedDocumentItem,
};
