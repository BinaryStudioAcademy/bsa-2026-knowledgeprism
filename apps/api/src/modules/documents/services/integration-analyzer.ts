import {
	flattenContentToText,
	mapWithConcurrency,
} from "@knowledgeprism/config";
import {
	DocumentErrorMessage,
	DocumentProcessingPhase,
	DocumentStatus,
	ExtractionItemStatus,
	KnowledgeNodeType,
} from "@knowledgeprism/constants";
import {
	type DocumentPlacementDto,
	type DocumentProcessingProgressDto,
} from "@knowledgeprism/types";
import {
	analyze,
	embed,
	type EmbeddingCandidate,
	EmbeddingInputType,
	type PlacementTreeNode,
	type RecordedSectionPlacement,
	toRecordedSectionPlacement,
} from "@knowledgeprism/worker";

import { type Database } from "~/infrastructure/database/database.js";
import { ProcessingSupersededError } from "~/modules/documents/libs/exceptions/processing-superseded-error.exception.js";
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
	extractionItemRepository: ExtractionItemRepository;
	integrationChangeRepository: IntegrationChangeRepository;
	knowledgeNodeRepository: KnowledgeNodeRepository;
};

type KnowledgeCandidate = {
	content: string;
	id: number;
	title: string;
};

const ANALYSIS_TEXT_SEPARATOR = "\n";
const MAXIMUM_CONCURRENT_ANALYSES = 8;

const toAnalysisText = (title: string, content: string): string =>
	[title, content].join(ANALYSIS_TEXT_SEPARATOR).trim();

type AnalysisContext = {
	candidates: EmbeddingCandidate<KnowledgeCandidate>[];
	documents: PlacementTreeNode[];
	onProgress: (progress: DocumentProcessingProgressDto) => Promise<void>;
	progress: DocumentProcessingProgressDto;
};

const UNSECTIONED_GROUP_PREFIX = "page-";

const toSectionGroupKey = (item: ExtractionItemEntity): string => {
	const { extractionSectionId, sourcePageNumber } = item.toObject();

	return extractionSectionId === null
		? `${UNSECTIONED_GROUP_PREFIX}${String(sourcePageNumber)}`
		: String(extractionSectionId);
};

const groupBySection = (
	items: ExtractionItemEntity[],
): ExtractionItemEntity[][] => {
	const groups = new Map<string, ExtractionItemEntity[]>();

	for (const item of items) {
		const key = toSectionGroupKey(item);
		groups.set(key, [...(groups.get(key) ?? []), item]);
	}

	return groups.values().toArray();
};

class IntegrationAnalyzer {
	private analyze: Analyze;

	private database: Database;

	private documentRepository: DocumentRepository;

	private extractionItemRepository: ExtractionItemRepository;

	private integrationChangeRepository: IntegrationChangeRepository;

	private knowledgeNodeRepository: KnowledgeNodeRepository;

	public constructor({
		analyze: analyzeItem = analyze,
		database,
		documentRepository,
		extractionItemRepository,
		integrationChangeRepository,
		knowledgeNodeRepository,
	}: Constructor) {
		this.analyze = analyzeItem;
		this.database = database;
		this.documentRepository = documentRepository;
		this.extractionItemRepository = extractionItemRepository;
		this.integrationChangeRepository = integrationChangeRepository;
		this.knowledgeNodeRepository = knowledgeNodeRepository;
	}

	private async analyzeItem(
		item: ExtractionItemEntity,
		priorPlacements: RecordedSectionPlacement[],
		{ candidates, documents, onProgress, progress }: AnalysisContext,
	): Promise<IntegrationChangeEntity> {
		const { documentId, id, text, title } = item.toObject();
		let result: Awaited<ReturnType<Analyze>>;

		try {
			result = await this.analyze({
				candidates,
				documents,
				itemText: toAnalysisText(title, text),
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

		const placed = toRecordedSectionPlacement({
			extractionItemId: id,
			priorPlacements,
			result,
			title,
			tree: documents,
		});

		priorPlacements.push(placed.recorded);

		const placement: DocumentPlacementDto = {
			matches: result.matches.map((match) => ({
				content: match.item.content,
				nodeId: match.item.id,
				span: match.span,
				title: match.item.title,
			})),
			parentExtractionItemId: placed.parentExtractionItemId,
			parentId: placed.parentId,
			parentTitle: placed.parentTitle,
			proposesParent: placed.proposesParent,
			siblingOrder: placed.siblingOrder,
		};

		return IntegrationChangeEntity.initializeNew({
			documentId,
			explanation: result.explanation,
			extractionItemId: id,
			incomingContent: text,
			incomingTitle: title,
			liveContent: result.matchedItem?.content ?? null,
			liveTitle: result.matchedItem?.title ?? null,
			matchedNodeId: result.matchedItem?.id ?? null,
			placement,
			score: result.score,
			type: result.type,
		});
	}

	private async analyzeItems({
		candidates,
		documents,
		items,
		onProgress,
	}: {
		candidates: EmbeddingCandidate<KnowledgeCandidate>[];
		documents: PlacementTreeNode[];
		items: ExtractionItemEntity[];
		onProgress: (progress: DocumentProcessingProgressDto) => Promise<void>;
	}): Promise<IntegrationChangeEntity[]> {
		const context: AnalysisContext = {
			candidates,
			documents,
			onProgress,
			progress: {
				failedUnits: 0,
				phase: DocumentProcessingPhase.INTEGRATING,
				processedUnits: 0,
				totalUnits: items.length,
			},
		};
		const analyzedGroups = await mapWithConcurrency(
			groupBySection(items),
			MAXIMUM_CONCURRENT_ANALYSES,
			async (group) => {
				const priorPlacements: RecordedSectionPlacement[] = [];
				const groupChanges: IntegrationChangeEntity[] = [];

				for (const item of group) {
					groupChanges.push(
						await this.analyzeItem(item, priorPlacements, context),
					);
				}

				return groupChanges;
			},
		);
		const changeByItemId = new Map(
			analyzedGroups
				.flat()
				.map((change) => [change.toObject().extractionItemId, change]),
		);
		const changes = items.flatMap((item) => {
			const change = changeByItemId.get(item.toObject().id);

			return change ? [change] : [];
		});

		return toResolvableChanges(changes);
	}

	private async loadCandidates(
		nodes: KnowledgeNodeEntity[],
	): Promise<EmbeddingCandidate<KnowledgeCandidate>[]> {
		const candidates = nodes
			.map((node) => node.toObject())
			.filter(({ type }) => type === KnowledgeNodeType.ENTRY)
			.map(({ contentJson, id, title }) => ({
				content: flattenContentToText(contentJson),
				id,
				title,
			}))
			.filter(({ content, title }) => toAnalysisText(title, content) !== "");
		const vectors = await embed(
			candidates.map(({ content, title }) => toAnalysisText(title, content)),
			EmbeddingInputType.SEARCH_DOCUMENT,
		);

		return candidates.flatMap((item, index) => {
			const vector = vectors[index];

			return vector ? [{ item, vector }] : [];
		});
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
		const onProgress = async (
			progress: DocumentProcessingProgressDto,
		): Promise<void> => {
			const isStillCurrent =
				await this.documentRepository.updateProcessingProgress({
					id: documentId,
					processingAttempt: attempt,
					progress,
					status: DocumentStatus.INTEGRATING,
				});

			if (!isStillCurrent) {
				throw new ProcessingSupersededError();
			}
		};
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
		const changes = await this.analyzeItems({
			candidates,
			documents,
			items: approvedItems,
			onProgress,
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
