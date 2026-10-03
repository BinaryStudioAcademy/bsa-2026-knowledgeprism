import { flattenContentToText } from "@knowledgeprism/config";
import {
	DocumentErrorMessage,
	DocumentProcessingPhase,
	DocumentStatus,
	ExtractionItemStatus,
	IntegrationChangeType,
	KnowledgeNodeType,
} from "@knowledgeprism/constants";
import {
	type DocumentPlacementDto,
	type DocumentProcessingProgressDto,
	type ExtractionContentBlock,
	type KnowledgeNodeContentDto,
	type ValueOf,
} from "@knowledgeprism/types";
import {
	analyze,
	embedChunked,
	type EmbeddingCandidate,
	type EmbeddingEntry,
	EmbeddingInputType,
	isAutoNewResult,
	mergeNodeBlocks,
	type PlacementTreeNode,
	type RecordedSectionPlacement,
	toEmbeddingEntry,
	toRecordedSectionPlacement,
} from "@knowledgeprism/worker";

import { type Database } from "~/infrastructure/database/database.js";
import { type Logger } from "~/infrastructure/logger/logger.js";
import { NodeMergeMethod } from "~/modules/documents/libs/constants/node-merge-method.constant.js";
import { createOrderedProgressReporter } from "~/modules/documents/libs/helpers/create-ordered-progress-reporter.helper.js";
import { toExtractionBlocks } from "~/modules/documents/libs/helpers/to-extraction-blocks.helper.js";
import { toIntegrationMetrics } from "~/modules/documents/libs/helpers/to-integration-metrics.helper.js";
import { toKnowledgeContentJson } from "~/modules/documents/libs/helpers/to-knowledge-content-json.helper.js";
import { toResolvableChanges } from "~/modules/documents/libs/helpers/to-resolvable-changes.helper.js";
import { type ProcessingAttempt } from "~/modules/documents/libs/types/processing-attempt.type.js";
import { type ExtractionItemEntity } from "~/modules/documents/models/extraction-item.entity.js";
import { IntegrationChangeEntity } from "~/modules/documents/models/integration-change.entity.js";
import { type DocumentRepository } from "~/modules/documents/repositories/document.repository.js";
import { type ExtractionItemRepository } from "~/modules/documents/repositories/extraction-item.repository.js";
import { type IntegrationChangeRepository } from "~/modules/documents/repositories/integration-change.repository.js";
import { type KnowledgeNodeEntity } from "~/modules/knowledge/models/knowledge-node.entity.js";
import { type KnowledgeNodeRepository } from "~/modules/knowledge/repositories/knowledge-node.repository.js";

type Analyze = typeof analyze<KnowledgeCandidate>;

type Constructor = {
	analyze?: Analyze;
	database: Database;
	documentRepository: DocumentRepository;
	embedChunked?: EmbedChunked;
	extractionItemRepository: ExtractionItemRepository;
	integrationChangeRepository: IntegrationChangeRepository;
	isNodeMergeEnabled?: boolean;
	knowledgeNodeRepository: KnowledgeNodeRepository;
	logger: Logger;
	mergeNodeBlocks?: MergeNodeBlocks;
};

type EmbedChunked = typeof embedChunked<KnowledgeCandidate>;

type KnowledgeCandidate = {
	content: string;
	extractionItemId: null | number;
	id: null | number;
	title: string;
};

type MergeNodeBlocks = typeof mergeNodeBlocks;

type NodeMerge = {
	mergedBlocks: ExtractionContentBlock[] | null;
	mergeMethod: null | ValueOf<typeof NodeMergeMethod>;
};

const ANALYSIS_TEXT_SEPARATOR = "\n";
const EMPTY_BLOCK_COUNT = 0;
const MERGED_CHANGE_TYPES = new Set<string>([
	IntegrationChangeType.CONFLICT,
	IntegrationChangeType.UPDATE,
]);
const NO_NODE_MERGE: NodeMerge = { mergedBlocks: null, mergeMethod: null };
const EARLIER_SECTION_EXPLANATION =
	"It overlaps an earlier section of this document, so both are kept.";

const toAnalysisText = (title: string, content: string): string =>
	[title, content].join(ANALYSIS_TEXT_SEPARATOR).trim();

type AnalysisContext = {
	candidates: EmbeddingCandidate<KnowledgeCandidate>[];
	documents: PlacementTreeNode[];
	nodeContentById: Map<number, KnowledgeNodeContentDto>;
	onProgress: (progress: DocumentProcessingProgressDto) => Promise<void>;
	progress: DocumentProcessingProgressDto;
	skippedClassification: { count: number };
};

const toItemEntry = ({
	blocks,
	text,
	title,
}: {
	blocks: ExtractionContentBlock[];
	text: string;
	title: string;
}): EmbeddingEntry => {
	return blocks.length === EMPTY_BLOCK_COUNT
		? { text, title }
		: toEmbeddingEntry({ blocks, title });
};

const toDocumentResult = (
	result: Awaited<ReturnType<Analyze>>,
): Awaited<ReturnType<Analyze>> => {
	const isEarlierSection = result.matchedItem?.extractionItemId != null;

	if (!isEarlierSection || result.type === IntegrationChangeType.DUPLICATE) {
		return result;
	}

	return {
		...result,
		explanation: `${result.explanation} ${EARLIER_SECTION_EXPLANATION}`,
		matchedItem: null,
		matches: [],
		type: IntegrationChangeType.NEW,
	};
};

class IntegrationAnalyzer {
	private analyze: Analyze;

	private database: Database;

	private documentRepository: DocumentRepository;

	private embedChunked: EmbedChunked;

	private extractionItemRepository: ExtractionItemRepository;

	private integrationChangeRepository: IntegrationChangeRepository;

	private isNodeMergeEnabled: boolean;

	private knowledgeNodeRepository: KnowledgeNodeRepository;

	private logger: Logger;

	private mergeNodeBlocks: MergeNodeBlocks;

	public constructor({
		analyze: analyzeItem = analyze,
		database,
		documentRepository,
		embedChunked: embedChunkedEntries = embedChunked,
		extractionItemRepository,
		integrationChangeRepository,
		isNodeMergeEnabled = false,
		knowledgeNodeRepository,
		logger,
		mergeNodeBlocks: mergeBlocks = mergeNodeBlocks,
	}: Constructor) {
		this.analyze = analyzeItem;
		this.database = database;
		this.embedChunked = embedChunkedEntries;
		this.documentRepository = documentRepository;
		this.extractionItemRepository = extractionItemRepository;
		this.integrationChangeRepository = integrationChangeRepository;
		this.isNodeMergeEnabled = isNodeMergeEnabled;
		this.knowledgeNodeRepository = knowledgeNodeRepository;
		this.logger = logger;
		this.mergeNodeBlocks = mergeBlocks;
	}

	private async analyzeItem(
		{
			item,
			itemCandidates,
		}: {
			item: ExtractionItemEntity;
			itemCandidates: EmbeddingCandidate<KnowledgeCandidate>[];
		},
		priorPlacements: RecordedSectionPlacement[],
		{
			candidates,
			documents,
			nodeContentById,
			onProgress,
			progress,
			skippedClassification,
		}: AnalysisContext,
	): Promise<IntegrationChangeEntity> {
		const { blocks, documentId, id, text, title } = item.toObject();
		let result: Awaited<ReturnType<Analyze>>;

		try {
			result = await this.analyze({
				candidates,
				documents,
				itemText: toAnalysisText(title, text),
				itemVectors: itemCandidates.map(({ vector }) => vector),
				priorPlacements,
			});
		} catch (error) {
			progress.processedUnits++;
			progress.failedUnits++;
			await onProgress({ ...progress });
			throw error;
		}

		progress.processedUnits++;
		await onProgress({ ...progress });

		if (isAutoNewResult(result)) {
			skippedClassification.count++;
		}

		const resolved = toDocumentResult(result);

		if (resolved.type === IntegrationChangeType.NEW) {
			candidates.push(...itemCandidates);
		}

		const placed = toRecordedSectionPlacement({
			extractionItemId: id,
			priorPlacements,
			result: resolved,
			title,
			tree: documents,
		});

		priorPlacements.push(placed.recorded);

		const placement: DocumentPlacementDto = {
			matches: resolved.matches.flatMap((match) =>
				match.item.id === null
					? []
					: [
							{
								content: match.item.content,
								nodeId: match.item.id,
								span: match.span,
								title: match.item.title,
							},
						],
			),
			parentExtractionItemId: placed.parentExtractionItemId,
			parentId: placed.parentId,
			parentTitle: placed.parentTitle,
			proposesParent: placed.proposesParent,
			siblingOrder: placed.siblingOrder,
		};

		const nodeMerge = await this.mergeIntoNode({
			blocks: blocks ?? [],
			extractionItemId: id,
			matchedItem: resolved.matchedItem,
			nodeContentById,
			text,
			title,
			type: resolved.type,
		});

		return IntegrationChangeEntity.initializeNew({
			...nodeMerge,
			documentId,
			duplicateOfExtractionItemId:
				resolved.type === IntegrationChangeType.DUPLICATE
					? (resolved.matchedItem?.extractionItemId ?? null)
					: null,
			explanation: resolved.explanation,
			extractionItemId: id,
			incomingContent: text,
			incomingTitle: title,
			liveContent: resolved.matchedItem?.content ?? null,
			liveTitle: resolved.matchedItem?.title ?? null,
			matchedNodeId: resolved.matchedItem?.id ?? null,
			placement,
			score: resolved.score,
			type: resolved.type,
		});
	}

	private async analyzeItems({
		candidates,
		documents,
		items,
		nodeContentById,
		onProgress,
		skippedClassification,
	}: {
		candidates: EmbeddingCandidate<KnowledgeCandidate>[];
		documents: PlacementTreeNode[];
		items: ExtractionItemEntity[];
		nodeContentById: Map<number, KnowledgeNodeContentDto>;
		onProgress: (progress: DocumentProcessingProgressDto) => Promise<void>;
		skippedClassification: { count: number };
	}): Promise<IntegrationChangeEntity[]> {
		const context: AnalysisContext = {
			candidates,
			documents,
			nodeContentById,
			onProgress,
			progress: {
				failedUnits: 0,
				phase: DocumentProcessingPhase.INTEGRATING,
				processedUnits: 0,
				totalUnits: items.length,
			},
			skippedClassification,
		};
		const priorPlacements: RecordedSectionPlacement[] = [];
		const changes: IntegrationChangeEntity[] = [];

		const itemCandidates = await this.embedChunked(
			items.map((item) => {
				const { blocks, id, text, title } = item.toObject();

				return {
					entry: toItemEntry({ blocks: blocks ?? [], text, title }),
					item: { content: text, extractionItemId: id, id: null, title },
				};
			}),
			EmbeddingInputType.SEARCH_DOCUMENT,
		);

		for (const item of items) {
			const { id } = item.toObject();

			changes.push(
				await this.analyzeItem(
					{
						item,
						itemCandidates: itemCandidates.filter(
							(candidate) => candidate.item.extractionItemId === id,
						),
					},
					priorPlacements,
					context,
				),
			);
		}

		return toResolvableChanges(changes);
	}

	private async loadCandidates(
		nodes: KnowledgeNodeEntity[],
	): Promise<EmbeddingCandidate<KnowledgeCandidate>[]> {
		const entries = nodes
			.map((node) => node.toObject())
			.filter(({ type }) => type === KnowledgeNodeType.ENTRY)
			.map(({ contentJson, id, title }) => ({
				entry: toEmbeddingEntry({ blocks: contentJson, title }),
				item: {
					content: flattenContentToText(contentJson),
					extractionItemId: null,
					id,
					title,
				},
			}))
			.filter(({ item }) => toAnalysisText(item.title, item.content) !== "");

		return await this.embedChunked(entries, EmbeddingInputType.SEARCH_DOCUMENT);
	}

	private loadDocuments(nodes: KnowledgeNodeEntity[]): PlacementTreeNode[] {
		return nodes
			.map((node) => node.toObject())
			.map(({ id, parentId, position, title, type }) => ({
				id,
				parentId,
				position,
				title,
				type,
			}));
	}

	private async mergeIntoNode({
		blocks,
		extractionItemId,
		matchedItem,
		nodeContentById,
		text,
		title,
		type,
	}: {
		blocks: ExtractionContentBlock[];
		extractionItemId: number;
		matchedItem: KnowledgeCandidate | null;
		nodeContentById: Map<number, KnowledgeNodeContentDto>;
		text: string;
		title: string;
		type: string;
	}): Promise<NodeMerge> {
		const matchedNodeId = matchedItem?.id ?? null;

		if (
			matchedItem === null ||
			matchedNodeId === null ||
			!this.isNodeMergeEnabled ||
			!MERGED_CHANGE_TYPES.has(type)
		) {
			return NO_NODE_MERGE;
		}

		const nodeContent = nodeContentById.get(matchedNodeId);
		const existingBlocks = nodeContent ? toExtractionBlocks(nodeContent) : null;
		const incomingBlocks = toExtractionBlocks(
			toKnowledgeContentJson({ blocks, fallbackText: text, title }),
		);
		const { blocks: mergedBlocks, coverage } =
			existingBlocks && incomingBlocks
				? await this.mergeNodeBlocks({
						existingBlocks,
						incomingBlocks,
						title: matchedItem.title,
					})
				: { blocks: null, coverage: null };
		const mergeMethod = mergedBlocks
			? NodeMergeMethod.LLM
			: NodeMergeMethod.FALLBACK;

		this.logger.info("Node merge.", {
			coverage,
			extractionItemId,
			matchedNodeId,
			mergeMethod,
		});

		return { mergedBlocks, mergeMethod };
	}

	public async process({
		attempt,
		documentId,
	}: ProcessingAttempt): Promise<boolean> {
		const document = await this.documentRepository.findById(documentId);

		if (!document) {
			throw new Error(DocumentErrorMessage.NOT_FOUND);
		}

		const items =
			await this.extractionItemRepository.findByDocumentId(documentId);
		const approvedItems = items.filter(
			(item) => item.toObject().status === ExtractionItemStatus.APPROVED,
		);
		const onProgress = createOrderedProgressReporter((progress) =>
			this.documentRepository.updateProcessingProgress({
				id: documentId,
				processingAttempt: attempt,
				progress,
				status: DocumentStatus.INTEGRATING,
			}),
		);
		const isCurrent = await this.documentRepository.updateProcessingProgress({
			id: documentId,
			processingAttempt: attempt,
			progress: {
				failedUnits: 0,
				phase: DocumentProcessingPhase.INTEGRATING,
				processedUnits: 0,
				totalUnits: approvedItems.length,
			},
			status: DocumentStatus.INTEGRATING,
		});
		if (!isCurrent) {
			return false;
		}
		const projectId = document.toObject().projectId;
		const nodes =
			await this.knowledgeNodeRepository.findAllByProjectId(projectId);
		const candidates = await this.loadCandidates(nodes);
		const documents = this.loadDocuments(nodes);
		const skippedClassification = { count: 0 };
		const changes = await this.analyzeItems({
			candidates,
			documents,
			items: approvedItems,
			nodeContentById: new Map(
				nodes.map((node) => {
					const { contentJson, id } = node.toObject();

					return [id, contentJson] as const;
				}),
			),
			onProgress,
			skippedClassification,
		});

		this.logger.info("Document integration metrics.", {
			documentId,
			processingAttempt: attempt,
			...toIntegrationMetrics({
				skippedClassification: skippedClassification.count,
				types: changes.map((change) => change.toObject().type),
			}),
		});

		return await this.database.transaction(async (transaction) => {
			const analyzedDocument =
				await this.documentRepository.compareAndSwapStatus(
					{
						errorMessage: null,
						expectedStatus: DocumentStatus.INTEGRATING,
						id: documentId,
						processingAttempt: attempt,
						status: DocumentStatus.WAITING_FOR_APPROVAL,
					},
					transaction,
				);

			if (!analyzedDocument) {
				return false;
			}

			await this.integrationChangeRepository.replaceByDocumentId(
				{ changes, documentId },
				transaction,
			);

			return true;
		});
	}
}

export { IntegrationAnalyzer };
