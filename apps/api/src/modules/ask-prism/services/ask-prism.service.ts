import { type AskPrismResponseDto } from "@knowledgeprism/types";
import { embed, EmbeddingInputType, search } from "@knowledgeprism/worker";

import { type KnowledgeNodeRepository } from "~/modules/knowledge/repositories/knowledge-node.repository.js";
import {
	type ProjectAccessContext,
	type ProjectService,
} from "~/modules/projects/services/project.service.js";

import { invokeRagGeneration } from "../libs/helpers/invoke-rag-generation.helper.js";

type Constructor = {
	knowledgeNodeRepository: KnowledgeNodeRepository;
	projectService: ProjectService;
};

const EMPTY_LENGTH = 0;

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
			if (Array.isArray(node)) {
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

	public async generateAnswer(
		projectId: number,
		question: string,
		context: ProjectAccessContext,
	): Promise<AskPrismResponseDto> {
		await this.projectService.findById(projectId, context);

		// 1. Embed Query
		const [queryVector] = await embed(
			[question],
			EmbeddingInputType.SEARCH_QUERY,
		);

		if (!queryVector) {
			throw new Error("Failed to generate embedding for the question");
		}

		// 2. Fetch Knowledge Nodes & Extract Text
		const nodes =
			await this.knowledgeNodeRepository.findAllByProjectId(projectId);

		if (nodes.length === EMPTY_LENGTH) {
			return {
				answer: "Not found in the knowledge base.",
				sources: [],
			};
		}

		const contexts = nodes
			.map((node) => {
				const nodeObject = node.toObject();
				return {
					content: this.extractTextFromBlocks(nodeObject.contentJson),
					id: nodeObject.id,
					nodeId: nodeObject.id,
					sectionTitle: nodeObject.title,
					title: nodeObject.title,
				};
			})
			.filter((c) => c.content.length > EMPTY_LENGTH);

		if (contexts.length === EMPTY_LENGTH) {
			return {
				answer: "Not found in the knowledge base.",
				sources: [],
			};
		}

		// 3. Embed Nodes on the fly
		const nodeVectors = await embed(
			contexts.map((c) => c.content),
			EmbeddingInputType.SEARCH_DOCUMENT,
		);

		// 4. In-Memory Search
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

		// 3. Execute Search
		const matches = search({
			candidates,
			queryVector,
			topK: 2,
		});

		// 4. Handle Missing Context
		// If the top match score is very low, we can assume it's not found
		const SCORE_THRESHOLD = 0.2; // Arbitrary threshold for MVP
		const ZERO_MATCHES = 0;
		const FIRST_MATCH_INDEX = 0;

		const topMatch = matches[FIRST_MATCH_INDEX];

		if (
			!topMatch ||
			matches.length === ZERO_MATCHES ||
			topMatch.score < SCORE_THRESHOLD
		) {
			return {
				answer: "Not found in the project's knowledge base.",
				sources: [],
			};
		}

		// 5. Construct Prompt & Generate Answer
		const contextChunks = matches.map((match) => match.item.content);
		const answer = await invokeRagGeneration(question, contextChunks);

		// 6. Format Response
		return {
			answer,
			sources: matches.map((match) => ({
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

		if (nodes.length === EMPTY_LENGTH) {
			return [
				"What are the main features of this project?",
				"What are the coding guidelines?",
				"How do I get started?",
			];
		}

		const MAX_SUGGESTIONS = 3;

		return nodes
			.slice(EMPTY_LENGTH, MAX_SUGGESTIONS)
			.map((node) => `Tell me about ${node.toObject().title}`);
	}
}
export { AskPrismService };
