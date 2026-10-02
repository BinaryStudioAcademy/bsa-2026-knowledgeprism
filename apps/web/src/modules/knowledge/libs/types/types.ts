import { type PartialBlock } from "@blocknote/core";
import {
	type DocumentStatus,
	KnowledgeNodeType,
} from "@knowledgeprism/constants";
import {
	type DocumentStatusResponseDto,
	type ExtractionItemResponseDto,
	type ExtractionSectionResponseDto,
	type IntegrationChangesApplyRequestDto,
	type KnowledgeEntryResponseDto,
	type KnowledgeTreeItemResponseDto,
} from "@knowledgeprism/types";

import { type ValueOf } from "~/lib/types/types.js";

import { type DocumentProcessingStatus } from "../enums/enums.js";

type ActiveNodeType = "child" | "parent";

type ChangeStatus = "conflict" | "created" | "duplicate" | "modified";

type ConflictResolution = "both" | "keep" | "use-new";

type FieldConflict = {
	changeId: number;
	currentValue: string;
	field: "content" | "title";
	id: string;
	incomingValue: string;
	matchedNodeId: null | number;
	matchIndex?: number;
	resolution?: ConflictResolution;
	wordingMatches?: WordingMatchPreview[];
};

type IntegrationPreviewProperties = {
	errorMessage?: null | string;
	failedPageNumbers?: number[];
	onAddMore: () => void;
	onApplyingChange?: (isApplying: boolean) => void;
	onApprove?: (payload: IntegrationChangesApplyRequestDto) => Promise<boolean>;
	onCancelDocument?: () => void;
	onClose: () => void;
	placementStructure?: ProposedSection[];
	placementTargets?: PlacementTarget[];
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
	documentStatuses: Record<number, DocumentStatusResponseDto>;
	documentStructureRequestId: null | string;
	entryRequestId: null | string;
	extractionFailedPageNumbers: number[];
	extractionItems: ExtractionItemResponseDto[];
	extractionItemsDocumentId: null | number;
	extractionSections: ExtractionSectionResponseDto[];
	integrationPreviewDocumentId: null | number;
	integrationPreviewError: null | string;
	integrationPreviewRequestId: null | string;
	integrationPreviewSections: ProposedSection[];
	isAddingKnowledge: boolean;
	isDocumentStructurePending: boolean;
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
	removedOpenDocument: null | {
		projectId: string;
		queryNodeId: null | string;
	};
	selectedEntry: KnowledgeEntryResponseDto | null;
	selectedFiles: UploadedDocumentItem[];
	statusRequestIds: Record<number, string>;
	trackedDocuments: TrackedDocument[];
	tree: KnowledgeTreeItemResponseDto[];
	treeRequestId: null | string;
	treeRevision: number;
	updateEntryRequestIds: Record<number, string>;
	uploadSession: null | UploadSession;
	uploadSessionSequence: number;
};

type PipelineSessionScope = {
	pipelineSessionId: number;
	projectId: string;
};

type PlacementTarget = {
	id: number;
	title: string;
};

type ProposedPage = {
	blocks?: PartialBlock[];
	conflicts?: FieldConflict[];
	content: string;
	explanation?: string;
	id: string;
	integrationChangeId: number;
	matchedNodeId?: number;
	originalContent?: string;
	originalTitle?: string;
	placementParentExtractionItemId?: null | number;
	placementParentId?: null | number;
	proposedHeading?: string;
	proposedPlace?: string;
	sourceExcerpt?: string;
	sourcePageNumber?: number;
	status: ChangeStatus;
	summary?: string;
	title: string;
	type: typeof KnowledgeNodeType.ENTRY | typeof KnowledgeNodeType.PAGE;
	wordingMatches?: WordingMatchPreview[];
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

type WordingMatchPreview = {
	content?: string;
	nodeId?: number;
	span: string;
	title?: string;
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
	type PlacementTarget,
	type ProposedPage,
	type ProposedSection,
	type TrackedDocument,
	type UploadedDocumentItem,
};
