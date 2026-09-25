import { type PartialBlock } from "@blocknote/core";
import { KnowledgeNodeType } from "@knowledgeprism/constants";
import {
	type IntegrationConflictResolutionDto,
	type KnowledgeEntryResponseDto,
	type KnowledgeSearchItemDto,
	type KnowledgeTreeItemResponseDto,
} from "@knowledgeprism/types";

import { type ValueOf } from "~/lib/types/types.js";

import {
	type DocumentProcessingStatus,
	type SearchStatus,
} from "../enums/enums.js";

type ChangeStatus = "conflict" | "created" | "duplicate" | "modified";

type ConflictResolution = "keep" | "use-new";

type FieldConflict = {
	changeId: number;
	currentValue: string;
	field: "content" | "title";
	id: string;
	incomingValue: string;
	matchedNodeId: null | number;
	resolution?: ConflictResolution;
};

type IntegrationPreviewProperties = {
	onAddMore: () => void;
	onApprove: (
		resolutions: IntegrationConflictResolutionDto[],
	) => Promise<boolean>;
	onClose: () => void;
	proposedStructure: ProposedSection[];
};

interface KbEntry {
	contentJson: PartialBlock[] | Record<string, unknown>[];
	createdAt?: string;
	id: number;
	title: string;
	updatedAt?: string;
}

type KnowledgeState = {
	activeDocumentId: null | number;
	errorMessage: null | string;
	integrationPreviewError: null | string;
	integrationPreviewSections: ProposedSection[];
	isAddingKnowledge: boolean;
	isEntryLoading: boolean;
	isIntegrationPreviewLoading: boolean;
	isTreeLoading: boolean;
	processingStatus: ValueOf<typeof DocumentProcessingStatus>;
	searchErrorMessage: null | string;
	searchQuery: string;
	searchResults: KnowledgeSearchItemDto[];
	searchStatus: ValueOf<typeof SearchStatus>;
	selectedEntry: KnowledgeEntryResponseDto | null;
	selectedFiles: UploadedDocumentItem[];
	tree: KnowledgeTreeItemResponseDto[];
};

type ProposedPage = {
	conflicts?: FieldConflict[];
	content: string;
	explanation?: string;
	id: string;
	integrationChangeId: number;
	matchedNodeId?: number;
	originalContent?: string;
	originalTitle?: string;
	status: ChangeStatus;
	summary?: string;
	title: string;
	type: typeof KnowledgeNodeType.ENTRY | typeof KnowledgeNodeType.PAGE;
};

type ProposedSection = {
	id: string;
	pages: ProposedPage[];
	status: ChangeStatus;
	title: string;
	type: typeof KnowledgeNodeType.SECTION;
};

type UploadedDocumentItem = {
	documentId?: number | undefined;
	errorMessage?: string | undefined;
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
