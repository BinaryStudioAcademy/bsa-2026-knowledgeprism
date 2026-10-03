import { flattenContentToText } from "@knowledgeprism/config";
import { KnowledgeNodeType } from "@knowledgeprism/constants";
import { type AskPrismResponseDto } from "@knowledgeprism/types";
import {
	embed,
	embedChunked,
	EmbeddingInputType,
	searchGrouped,
	toEmbeddingEntry,
} from "@knowledgeprism/worker";

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

type Constructor = {
	knowledgeNodeRepository: KnowledgeNodeRepository;
	projectService: ProjectService;
};

const EMPTY_LENGTH = 0;
const FILE_EXTENSION_PATTERN = /\.(pdf|txt|docx?|md|json)$/iu;
const MAX_SIMILAR_NODES = 3;
const MAX_SUGGESTIONS = 3;
const SCORE_THRESHOLD = 0.4;

class AskPrismService {
	private knowledgeNodeRepository: KnowledgeNodeRepository;
	private projectService: ProjectService;

	public constructor({ knowledgeNodeRepository, projectService }: Constructor) {
		this.knowledgeNodeRepository = knowledgeNodeRepository;
		this.projectService = projectService;
	}

	private isEligibleForSuggestion(node: KnowledgeNodeEntity): boolean {
		const nodeObject = node.toObject();
		const textContent = flattenContentToText(nodeObject.contentJson);

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
				const textContent = flattenContentToText(nodeObject.contentJson);
				const indexedContent = nodeObject.title
					? `${nodeObject.title}\n${textContent}`
					: textContent;

				return {
					content: textContent,
					entry: toEmbeddingEntry({
						blocks: nodeObject.contentJson,
						title: nodeObject.title,
					}),
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

		const [queryVector] = await embed(
			[question],
			EmbeddingInputType.SEARCH_QUERY,
			{ isLimited: false },
		);

		if (!queryVector) {
			throw new Error("Failed to generate embedding for the question");
		}

		const candidates = await embedChunked(
			contexts.map((contextItem) => ({
				entry: contextItem.entry,
				item: contextItem,
			})),
			EmbeddingInputType.SEARCH_DOCUMENT,
			{ isLimited: false },
		);
		const relevantMatches = searchGrouped({
			candidates,
			queryVectors: [queryVector],
			topK: MAX_SIMILAR_NODES,
		}).filter(({ score }) => score >= SCORE_THRESHOLD);

		if (relevantMatches.length === EMPTY_LENGTH) {
			return {
				answer: RAG_FALLBACK_MESSAGE,
				sources: [],
			};
		}

		const contextChunks = relevantMatches.map(
			(match) => match.item.indexedContent,
		);
		const answer = await invokeRagGeneration(question, contextChunks);

		if (answer.trim() === RAG_FALLBACK_MESSAGE) {
			return {
				answer,
				sources: [],
			};
		}

		return {
			answer,
			sources: relevantMatches.map((match) => ({
				excerpt: match.item.content,
				id: match.item.id,
				nodeId: match.item.nodeId,
				sectionTitle: match.item.sectionTitle,
				title: match.item.title,
			})),
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

export { AskPrismService, MAX_SIMILAR_NODES };
