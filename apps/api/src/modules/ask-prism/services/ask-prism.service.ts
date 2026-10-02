import { KnowledgeNodeType } from "@knowledgeprism/constants";
import { type AskPrismResponseDto, type ValueOf } from "@knowledgeprism/types";
import {
	embed,
	EmbeddingInputType,
	search,
	type SemanticSearchParameters,
	type SimilarityMatch,
} from "@knowledgeprism/worker";

import { type ExtractionItemRepository } from "~/modules/documents/repositories/extraction-item.repository.js";
import { type KnowledgeNodeEntity } from "~/modules/knowledge/models/knowledge-node.entity.js";
import { type KnowledgeNodeRepository } from "~/modules/knowledge/repositories/knowledge-node.repository.js";
import {
	type ProjectAccessContext,
	type ProjectService,
} from "~/modules/projects/services/project.service.js";

import { DEFAULT_SUGGESTED_QUESTIONS } from "../libs/constants/default-suggested-questions.constant.js";
import { RAG_FALLBACK_MESSAGE } from "../libs/constants/rag-fallback-message.constant.js";
import { formatSuggestedQuestion } from "../libs/helpers/format-suggested-question.helper.js";
import { invokeRagGeneration } from "../libs/helpers/invoke-rag-generation.helper.js";

type AskPrismContextItem = {
	content: string;
	id: number;
	indexedContent: string;
	nodeId: number;
	sectionTitle: string;
	title: string;
};

type Constructor = {
	embedder?: (
		texts: string[],
		inputType: ValueOf<typeof EmbeddingInputType>,
	) => Promise<number[][]>;
	extractionItemRepository?: ExtractionItemRepository | undefined;
	knowledgeNodeRepository: KnowledgeNodeRepository;
	projectService: ProjectService;
	ragGenerator?: (question: string, contextChunks: string[]) => Promise<string>;
	searcher?: (
		parameters: SemanticSearchParameters<AskPrismContextItem>,
	) => SimilarityMatch<AskPrismContextItem>[];
};

const EMPTY_LENGTH = 0;
const FILE_EXTENSION_PATTERN = /\.(pdf|txt|docx?|md|json)$/iu;
const MAX_SIMILAR_NODES = 3;
const MAX_SUGGESTIONS = 3;
const SCORE_THRESHOLD = 0.3;

class AskPrismService {
	private embedder: (
		texts: string[],
		inputType: ValueOf<typeof EmbeddingInputType>,
	) => Promise<number[][]>;
	private extractionItemRepository?: ExtractionItemRepository | undefined;
	private knowledgeNodeRepository: KnowledgeNodeRepository;
	private projectService: ProjectService;
	private ragGenerator: (
		question: string,
		contextChunks: string[],
	) => Promise<string>;
	private searcher: (
		parameters: SemanticSearchParameters<AskPrismContextItem>,
	) => SimilarityMatch<AskPrismContextItem>[];

	public constructor({
		embedder = embed,
		extractionItemRepository,
		knowledgeNodeRepository,
		projectService,
		ragGenerator = invokeRagGeneration,
		searcher = search,
	}: Constructor) {
		this.embedder = embedder;
		this.extractionItemRepository = extractionItemRepository;
		this.knowledgeNodeRepository = knowledgeNodeRepository;
		this.projectService = projectService;
		this.ragGenerator = ragGenerator;
		this.searcher = searcher;
	}

	private extractTextFromBlocks(blocks: Record<string, unknown>[]): string {
		let text = "";
		const traverse = (node: unknown): void => {
			if (typeof node === "string") {
				text += node + " ";
			} else if (Array.isArray(node)) {
				for (const child of node) {
					traverse(child);
				}
			} else if (typeof node === "object" && node !== null) {
				const record = node as Record<string, unknown>;
				if (record["type"] === "text" && typeof record["text"] === "string") {
					text += record["text"] + " ";
				}
				if (record["content"]) {
					traverse(record["content"]);
				}
			}
		};
		traverse(blocks);
		return text.trim();
	}

	private isEligibleForSuggestion(node: KnowledgeNodeEntity): boolean {
		const nodeObject = node.toObject();
		const textContent = this.extractTextFromBlocks(nodeObject.contentJson);

		if (
			nodeObject.type === KnowledgeNodeType.PAGE &&
			textContent.length === EMPTY_LENGTH
		) {
			return false;
		}

		if (!nodeObject.title || FILE_EXTENSION_PATTERN.test(nodeObject.title)) {
			return false;
		}

		return textContent.length > EMPTY_LENGTH;
	}

	private resolveFallbackDocumentName(
		parentNode: null | ReturnType<KnowledgeNodeEntity["toObject"]>,
		currentNode: null | ReturnType<KnowledgeNodeEntity["toObject"]> | undefined,
	): null | string {
		if (parentNode?.type === KnowledgeNodeType.PAGE) {
			return parentNode.title;
		}

		if (
			currentNode?.type === KnowledgeNodeType.PAGE &&
			FILE_EXTENSION_PATTERN.test(currentNode.title)
		) {
			return currentNode.title;
		}

		return null;
	}

	public async generateAnswer(
		projectId: number,
		question: string,
		context: ProjectAccessContext,
	): Promise<AskPrismResponseDto> {
		await this.projectService.findById(projectId, context);

		const nodes =
			await this.knowledgeNodeRepository.findAllByProjectId(projectId);

		if (nodes.length === EMPTY_LENGTH) {
			return {
				answer: RAG_FALLBACK_MESSAGE,
				sources: [],
			};
		}

		const contexts = nodes
			.map((node) => {
				const nodeObject = node.toObject();
				const textContent = this.extractTextFromBlocks(nodeObject.contentJson);
				const indexedContent = nodeObject.title
					? `${nodeObject.title}\n${textContent}`
					: textContent;

				return {
					content: textContent,
					id: nodeObject.id,
					indexedContent,
					nodeId: nodeObject.id,
					sectionTitle: nodeObject.title,
					title: nodeObject.title,
				};
			})
			.filter((c) => c.content.length > EMPTY_LENGTH);

		if (contexts.length === EMPTY_LENGTH) {
			return {
				answer: RAG_FALLBACK_MESSAGE,
				sources: [],
			};
		}

		const [queryVector] = await this.embedder(
			[question],
			EmbeddingInputType.SEARCH_QUERY,
			{ isLimited: false },
		);

		if (!queryVector) {
			throw new Error("Failed to generate embedding for the question");
		}

		const nodeVectors = await this.embedder(
			contexts.map((c) => c.indexedContent),
			EmbeddingInputType.SEARCH_DOCUMENT,
			{ isLimited: false },
		);

		const candidates = contexts.map((contextItem, index) => {
			const vector = nodeVectors[index];

			if (!vector) {
				throw new Error("Missing vector for context item");
			}

			return {
				item: contextItem,
				vector,
			};
		});

		const matches = this.searcher({
			candidates,
			queryVector,
			topK: MAX_SIMILAR_NODES,
		});

		const relevantMatches = matches.filter(
			(match) => match.score >= SCORE_THRESHOLD,
		);

		if (relevantMatches.length === EMPTY_LENGTH) {
			return {
				answer: RAG_FALLBACK_MESSAGE,
				sources: [],
			};
		}

		const contextChunks = relevantMatches.map(
			(match) => match.item.indexedContent,
		);
		const answer = await this.ragGenerator(question, contextChunks);

		if (answer.trim() === RAG_FALLBACK_MESSAGE) {
			return {
				answer,
				sources: [],
			};
		}

		const relevantNodeIds = relevantMatches.map((match) => match.item.nodeId);

		const sourceByKnowledgeNodeId = this.extractionItemRepository
			? await this.extractionItemRepository.findSourcesByKnowledgeNodeIds(
					relevantNodeIds,
				)
			: new Map<number, { documentName: string; pageNumber: number }>();

		const nodeById = new Map(
			nodes.map((node) => [node.toObject().id, node.toObject()]),
		);

		return {
			answer,
			sources: relevantMatches.map((match) => {
				const nodeId = match.item.nodeId;
				const sourceMetadata = sourceByKnowledgeNodeId.get(nodeId);
				const currentNode = nodeById.get(nodeId);
				const parentNode = currentNode?.parentId
					? (nodeById.get(currentNode.parentId) ?? null)
					: null;
				const fallbackDocumentName = this.resolveFallbackDocumentName(
					parentNode,
					currentNode,
				);

				return {
					documentName:
						sourceMetadata?.documentName ?? fallbackDocumentName ?? null,
					excerpt: match.item.content,
					id: match.item.id,
					nodeId: match.item.nodeId,
					pageNumber: sourceMetadata?.pageNumber ?? null,
					sectionTitle: match.item.sectionTitle,
					title: match.item.title,
				};
			}),
		};
	}

	public async getSuggestedQuestions(
		projectId: number,
		context: ProjectAccessContext,
	): Promise<string[]> {
		await this.projectService.findById(projectId, context);

		const nodes =
			await this.knowledgeNodeRepository.findAllByProjectId(projectId);

		const eligibleNodes = nodes.filter((node) =>
			this.isEligibleForSuggestion(node),
		);

		if (eligibleNodes.length === EMPTY_LENGTH) {
			return [...DEFAULT_SUGGESTED_QUESTIONS];
		}

		return eligibleNodes
			.slice(EMPTY_LENGTH, MAX_SUGGESTIONS)
			.map((node) => formatSuggestedQuestion(node.toObject().title));
	}
}

export {
	type Constructor as AskPrismServiceOptions,
	AskPrismService,
	MAX_SIMILAR_NODES,
};
