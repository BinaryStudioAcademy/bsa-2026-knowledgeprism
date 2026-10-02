import { KnowledgeNodeType } from "@knowledgeprism/constants";
import { type AskPrismResponseDto } from "@knowledgeprism/types";
import { embed, EmbeddingInputType, search } from "@knowledgeprism/worker";

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
import { splitIntoPassages } from "../libs/helpers/split-into-passages.helper.js";

type Constructor = {
	knowledgeNodeRepository: KnowledgeNodeRepository;
	projectService: ProjectService;
};

const EMPTY_LENGTH = 0;
const FILE_EXTENSION_PATTERN = /\.(pdf|txt|docx?|md|json)$/iu;
const MAX_SIMILAR_NODES = 3;
const MAX_SUGGESTIONS = 3;
const SCORE_THRESHOLD = 0.3;

class AskPrismService {
	private knowledgeNodeRepository: KnowledgeNodeRepository;
	private projectService: ProjectService;

	public constructor({ knowledgeNodeRepository, projectService }: Constructor) {
		this.knowledgeNodeRepository = knowledgeNodeRepository;
		this.projectService = projectService;
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

		const [queryVector] = await embed(
			[question],
			EmbeddingInputType.SEARCH_QUERY,
		);

		if (!queryVector) {
			throw new Error("Failed to generate embedding for the question");
		}

		const passages = contexts.flatMap((contextItem) =>
			splitIntoPassages(contextItem.title, contextItem.content).map((text) => ({
				item: contextItem,
				text,
			})),
		);
		const passageVectors = await embed(
			passages.map(({ text }) => text),
			EmbeddingInputType.SEARCH_DOCUMENT,
		);

		const candidates = passages.map(({ item }, index) => {
			const vector = passageVectors[index];

			if (!vector) {
				throw new Error("Missing vector for context item");
			}

			return { item, vector };
		});

		const matchedNodeIds = new Set<number>();
		const relevantMatches = search({
			candidates,
			queryVector,
			topK: candidates.length,
		})
			.filter(({ item, score }) => {
				if (score < SCORE_THRESHOLD || matchedNodeIds.has(item.nodeId)) {
					return false;
				}

				matchedNodeIds.add(item.nodeId);

				return true;
			})
			.slice(EMPTY_LENGTH, MAX_SIMILAR_NODES);

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
