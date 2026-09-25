import { flattenContentToText } from "@knowledgeprism/config";
import {
	DocumentErrorMessage,
	DocumentStatus,
	ExtractionItemStatus,
	KnowledgeNodeType,
} from "@knowledgeprism/constants";
import {
	analyze,
	embed,
	type EmbeddingCandidate,
	EmbeddingInputType,
} from "@knowledgeprism/worker";

import { type Database } from "~/infrastructure/database/database.js";
import { toResolvableChanges } from "~/modules/documents/libs/helpers/to-resolvable-changes.helper.js";
import { type ProcessingAttempt } from "~/modules/documents/libs/types/processing-attempt.type.js";
import { type ExtractionItemEntity } from "~/modules/documents/models/extraction-item.entity.js";
import { IntegrationChangeEntity } from "~/modules/documents/models/integration-change.entity.js";
import { type DocumentRepository } from "~/modules/documents/repositories/document.repository.js";
import { type ExtractionItemRepository } from "~/modules/documents/repositories/extraction-item.repository.js";
import { type IntegrationChangeRepository } from "~/modules/documents/repositories/integration-change.repository.js";
import { type KnowledgeNodeRepository } from "~/modules/knowledge/repositories/knowledge-node.repository.js";

type Constructor = {
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

const toAnalysisText = (title: string, content: string): string =>
	[title, content].join(ANALYSIS_TEXT_SEPARATOR).trim();

class IntegrationAnalyzer {
	private database: Database;

	private documentRepository: DocumentRepository;

	private extractionItemRepository: ExtractionItemRepository;

	private integrationChangeRepository: IntegrationChangeRepository;

	private knowledgeNodeRepository: KnowledgeNodeRepository;

	public constructor({
		database,
		documentRepository,
		extractionItemRepository,
		integrationChangeRepository,
		knowledgeNodeRepository,
	}: Constructor) {
		this.database = database;
		this.documentRepository = documentRepository;
		this.extractionItemRepository = extractionItemRepository;
		this.integrationChangeRepository = integrationChangeRepository;
		this.knowledgeNodeRepository = knowledgeNodeRepository;
	}

	private async analyzeItems({
		candidates,
		items,
	}: {
		candidates: EmbeddingCandidate<KnowledgeCandidate>[];
		items: ExtractionItemEntity[];
	}): Promise<IntegrationChangeEntity[]> {
		const changes: IntegrationChangeEntity[] = [];

		for (const item of items) {
			const { documentId, id, text, title } = item.toObject();
			const { explanation, matchedItem, score, type } = await analyze({
				candidates,
				itemText: toAnalysisText(title, text),
			});

			changes.push(
				IntegrationChangeEntity.initializeNew({
					documentId,
					explanation,
					extractionItemId: id,
					incomingContent: text,
					incomingTitle: title,
					liveContent: matchedItem?.content ?? null,
					liveTitle: matchedItem?.title ?? null,
					matchedNodeId: matchedItem?.id ?? null,
					score,
					type,
				}),
			);
		}

		return toResolvableChanges(changes);
	}

	private async loadCandidates(
		projectId: number,
	): Promise<EmbeddingCandidate<KnowledgeCandidate>[]> {
		const nodes =
			await this.knowledgeNodeRepository.findAllByProjectId(projectId);
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
		const candidates = await this.loadCandidates(document.toObject().projectId);
		const changes = await this.analyzeItems({
			candidates,
			items: approvedItems,
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
