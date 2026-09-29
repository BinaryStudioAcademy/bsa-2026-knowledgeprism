import { type PartialBlock } from "@blocknote/core";
import {
	type DocumentStatus,
	KnowledgeNodeType,
} from "@knowledgeprism/constants";
import {
	type ExtractionItemResponseDto,
	type ExtractionSectionResponseDto,
	type IntegrationConflictResolutionDto,
	type KnowledgeEntryResponseDto,
	type KnowledgeTreeItemResponseDto,
} from "@knowledgeprism/types";

import { type ValueOf } from "~/lib/types/types.js";

import { type DocumentProcessingStatus } from "../enums/enums.js";

type ActiveNodeType = "child" | "parent";

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
	errorMessage?: null | string;
	onAddMore: () => void;
	onApplyingChange?: (isApplying: boolean) => void;
	onApprove?: (
		resolutions: IntegrationConflictResolutionDto[],
	) => Promise<boolean>;
	onApproveExtraction?: (pages: ProposedSection[]) => Promise<boolean>;
	onClose: () => void;
	proposedStructure: ProposedSection[];
	variant?: IntegrationPreviewVariant;
};

type IntegrationPreviewVariant = "extraction-validation" | "integration";

interface KbEntry {
	contentJson: PartialBlock[] | Record<string, unknown>[];
	createdAt?: string;
	id: number;
	title: string;
	updatedAt?: string;
}

type KnowledgeState = {
	activeDocumentId: null | number;
	activeDocumentStatus: "IDLE" | ValueOf<typeof DocumentStatus>;
	activeDocumentSwitchRequestId: null | string;
	contentSearchRequestId: null | string;
	entryRequestId: null | string;
	extractionItems: ExtractionItemResponseDto[];
	extractionItemsDocumentId: null | number;
	extractionSections: ExtractionSectionResponseDto[];
	integrationPreviewDocumentId: null | number;
	integrationPreviewError: null | string;
	integrationPreviewRequestId: null | string;
	integrationPreviewSections: ProposedSection[];
	isAddingKnowledge: boolean;
	isEntryLoading: boolean;
	isIntegrationPreviewLoading: boolean;
	isSearchingContent: boolean;
	isTreeLoading: boolean;
	knowledgeErrorMessage: null | string;
	matchedContentEntryIds: number[];
	pendingReviewRequestId: null | string;
	pipelineErrors: Record<number, string>;
	pipelineProjectId: null | string;
	pipelineSessionId: number;
	processingStatus: ValueOf<typeof DocumentProcessingStatus>;
	selectedEntry: KnowledgeEntryResponseDto | null;
	selectedFiles: UploadedDocumentItem[];
	statusRequestIds: Record<number, string>;
	trackedDocuments: TrackedDocument[];
	tree: KnowledgeTreeItemResponseDto[];
	treeRequestId: null | string;
	treeRevision: number;
	updateEntryRequestIds: Record<number, string>;
	uploadErrorMessage: null | string;
	uploadSession: null | UploadSession;
	uploadSessionSequence: number;
};

type PipelineSessionScope = {
	pipelineSessionId: number;
	projectId: string;
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
	sourceExcerpt?: string;
	sourcePageNumber?: number;
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

type TrackedDocument = {
	documentId: number;
	label: string;
	status: "IDLE" | ValueOf<typeof DocumentStatus>;
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
	uploadUrlExpiresAt?: number | undefined;
};

type UploadSession = {
	id: number;
	projectId: string;
	subscriberCount: number;
};

export { type KnowledgeEntryUpdateRequestDto } from "@knowledgeprism/types";
export {
	type ActiveNodeType,
	type ChangeStatus,
	type ConflictResolution,
	type FieldConflict,
	type IntegrationPreviewProperties,
	type KbEntry,
	type KnowledgeState,
	type PipelineSessionScope,
	type ProposedPage,
	type ProposedSection,
	type TrackedDocument,
	type UploadedDocumentItem,
};
