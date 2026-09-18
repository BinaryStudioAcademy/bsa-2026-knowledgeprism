import { type AskPrismResponseDto } from "@knowledgeprism/types";
import { embed, EmbeddingInputType, search } from "@knowledgeprism/worker";

import { invokeRagGeneration } from "../libs/helpers/invoke-rag-generation.helper.js";

// TODO: Replace this with the real ProjectAccessContext exported from project.service.ts when PR #118 is merged
// type ProjectAccessContext = {
// 	organisationId: number;
// 	userId: number;
// };

class AskPrismService {
	/*
	 * Temporary mock of ProjectService.assertProjectAccess
	 * TODO: Replace with `await this.projectService.assertProjectAccess(projectId, context);`
	 *
	 * private assertProjectAccess(
	 * 	_projectId: number,
	 * 	_context: ProjectAccessContext,
	 * ): void {
	 * 	// Mock implementation: always allows access for now to unblock frontend
	 * 	return;
	 * }
	 */

	public async generateAnswer(question: string): Promise<AskPrismResponseDto> {
		// 1. Embed Query
		const [queryVector] = await embed(
			[question],
			EmbeddingInputType.SEARCH_QUERY,
		);

		if (!queryVector) {
			throw new Error("Failed to generate embedding for the question");
		}

		// 2. Mock Database Retrieval (dynamically embedding to simulate pgvector)
		const mockContexts = [
			{
				content:
					"Passwords must be at least 8 characters long and contain at least one uppercase letter and one special character.",
				id: 1,
				nodeId: 42,
				sectionTitle: "User Management Guidelines",
				title: "Password Validation Rules",
			},
			{
				content:
					"All API requests must include a Bearer token in the Authorization header.",
				id: 2,
				nodeId: 43,
				sectionTitle: "Security Policies",
				title: "Authentication Standards",
			},
			{
				content:
					"We have three environments: development, staging, and production.",
				id: 3,
				nodeId: 44,
				sectionTitle: "DevOps",
				title: "Project Environments",
			},
		];

		const mockVectors = await embed(
			mockContexts.map((c) => c.content),
			EmbeddingInputType.SEARCH_DOCUMENT,
		);

		const candidates = mockContexts.map((contextItem, index) => {
			const vector = mockVectors[index];

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
				id: match.item.id,
				nodeId: match.item.nodeId,
				sectionTitle: match.item.sectionTitle,
				title: match.item.title,
			})),
		};
	}
}

export { AskPrismService };
