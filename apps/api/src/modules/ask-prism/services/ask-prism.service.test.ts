import "~/test-setup.js";

import { KnowledgeNodeType } from "@knowledgeprism/constants";
import { search } from "@knowledgeprism/worker";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { KnowledgeNodeEntity } from "~/modules/knowledge/models/knowledge-node.entity.js";
import { type KnowledgeNodeRepository } from "~/modules/knowledge/repositories/knowledge-node.repository.js";
import {
	type ProjectAccessContext,
	type ProjectService,
} from "~/modules/projects/services/project.service.js";

import { DEFAULT_SUGGESTED_QUESTIONS } from "../libs/constants/default-suggested-questions.constant.js";
import { RAG_FALLBACK_MESSAGE } from "../libs/constants/rag-fallback-message.constant.js";
import { AskPrismService, MAX_SIMILAR_NODES } from "./ask-prism.service.js";

const COMPONENT_FRACTION_EIGHT = 0.8;
const COMPONENT_FRACTION_FOUR = 0.4;
const COMPONENT_FRACTION_NINE = 0.9;
const COMPONENT_FRACTION_ONE = 0.1;
const COMPONENT_FRACTION_SEVEN = 0.7;
const COMPONENT_FRACTION_SIX = 0.6;
const COMPONENT_FRACTION_THREE = 0.3;
const COMPONENT_FRACTION_TWO = 0.2;
const COMPONENT_ONE = 1;
const COMPONENT_ZERO = 0;
const EXPECTED_SIMILAR_NODES_LIMIT = 3;
const MAX_SUGGESTIONS = 3;
const NODE_ID_FOUR = 4;
const NODE_ID_ONE = 1;
const NODE_ID_THREE = 3;
const NODE_ID_TWO = 2;
const ORGANISATION_ID = 1;
const POSITION_FOUR = 3;
const POSITION_ONE = 0;
const POSITION_THREE = 2;
const POSITION_TWO = 1;
const PROJECT_ID = 1;
const QUESTION = "How does authentication work?";
const USER_ID = 1;

const CONTEXT: ProjectAccessContext = {
	organisationId: ORGANISATION_ID,
	userId: USER_ID,
};

const createTestSetup = (
	nodes: KnowledgeNodeEntity[] = [],
): {
	service: AskPrismService;
} => {
	const knowledgeNodeRepository = {
		findAllByProjectId: (): Promise<KnowledgeNodeEntity[]> =>
			Promise.resolve(nodes),
	} as unknown as KnowledgeNodeRepository;

	const projectService = {
		findById: (): Promise<unknown> => Promise.resolve({}),
	} as unknown as ProjectService;

	const service = new AskPrismService({
		knowledgeNodeRepository,
		projectService,
	});

	return { service };
};

void describe("AskPrismService.getSuggestedQuestions", () => {
	void it("returns default questions when there are no nodes in the project", async () => {
		const { service } = createTestSetup([]);

		const questions = await service.getSuggestedQuestions(PROJECT_ID, CONTEXT);

		assert.deepStrictEqual(questions, [...DEFAULT_SUGGESTED_QUESTIONS]);
	});

	void it("excludes empty page nodes and returns suggestions for entries with content", async () => {
		const emptyPageNode = KnowledgeNodeEntity.initialize({
			contentJson: [],
			createdAt: new Date(),
			id: NODE_ID_ONE,
			parentId: null,
			position: POSITION_ONE,
			projectId: PROJECT_ID,
			title: "manual.pdf",
			type: KnowledgeNodeType.PAGE,
			updatedAt: new Date(),
		});

		const entryNode = KnowledgeNodeEntity.initialize({
			contentJson: [
				{ content: "Authentication uses JWT tokens", type: "paragraph" },
			],
			createdAt: new Date(),
			id: NODE_ID_TWO,
			parentId: NODE_ID_ONE,
			position: POSITION_TWO,
			projectId: PROJECT_ID,
			title: "Authentication Architecture",
			type: KnowledgeNodeType.ENTRY,
			updatedAt: new Date(),
		});

		const { service } = createTestSetup([emptyPageNode, entryNode]);

		const questions = await service.getSuggestedQuestions(PROJECT_ID, CONTEXT);

		assert.deepStrictEqual(questions, [
			"Tell me about Authentication Architecture",
		]);
	});

	void it("returns default questions when all nodes in the project are empty page nodes", async () => {
		const emptyPageNode = KnowledgeNodeEntity.initialize({
			contentJson: [],
			createdAt: new Date(),
			id: NODE_ID_ONE,
			parentId: null,
			position: POSITION_ONE,
			projectId: PROJECT_ID,
			title: "empty-document.pdf",
			type: KnowledgeNodeType.PAGE,
			updatedAt: new Date(),
		});

		const { service } = createTestSetup([emptyPageNode]);

		const questions = await service.getSuggestedQuestions(PROJECT_ID, CONTEXT);

		assert.deepStrictEqual(questions, [...DEFAULT_SUGGESTED_QUESTIONS]);
	});

	void it("limits the number of suggestions to MAX_SUGGESTIONS", async () => {
		const nodes = [
			KnowledgeNodeEntity.initialize({
				contentJson: [{ content: "First entry content", type: "paragraph" }],
				createdAt: new Date(),
				id: NODE_ID_ONE,
				parentId: null,
				position: POSITION_ONE,
				projectId: PROJECT_ID,
				title: "First Topic",
				type: KnowledgeNodeType.ENTRY,
				updatedAt: new Date(),
			}),
			KnowledgeNodeEntity.initialize({
				contentJson: [{ content: "Second entry content", type: "paragraph" }],
				createdAt: new Date(),
				id: NODE_ID_TWO,
				parentId: null,
				position: POSITION_TWO,
				projectId: PROJECT_ID,
				title: "Second Topic",
				type: KnowledgeNodeType.ENTRY,
				updatedAt: new Date(),
			}),
			KnowledgeNodeEntity.initialize({
				contentJson: [{ content: "Third entry content", type: "paragraph" }],
				createdAt: new Date(),
				id: NODE_ID_THREE,
				parentId: null,
				position: POSITION_THREE,
				projectId: PROJECT_ID,
				title: "Third Topic",
				type: KnowledgeNodeType.ENTRY,
				updatedAt: new Date(),
			}),
			KnowledgeNodeEntity.initialize({
				contentJson: [{ content: "Fourth entry content", type: "paragraph" }],
				createdAt: new Date(),
				id: NODE_ID_FOUR,
				parentId: null,
				position: POSITION_FOUR,
				projectId: PROJECT_ID,
				title: "Fourth Topic",
				type: KnowledgeNodeType.ENTRY,
				updatedAt: new Date(),
			}),
		];

		const { service } = createTestSetup(nodes);

		const questions = await service.getSuggestedQuestions(PROJECT_ID, CONTEXT);

		assert.strictEqual(questions.length, MAX_SUGGESTIONS);
		assert.deepStrictEqual(questions, [
			"Tell me about First Topic",
			"Tell me about Second Topic",
			"Tell me about Third Topic",
		]);
	});

	void it("includes page nodes if they contain non-empty content", async () => {
		const pageWithContent = KnowledgeNodeEntity.initialize({
			contentJson: [{ content: "Overview documentation", type: "paragraph" }],
			createdAt: new Date(),
			id: NODE_ID_ONE,
			parentId: null,
			position: POSITION_ONE,
			projectId: PROJECT_ID,
			title: "Project Overview",
			type: KnowledgeNodeType.PAGE,
			updatedAt: new Date(),
		});

		const { service } = createTestSetup([pageWithContent]);

		const questions = await service.getSuggestedQuestions(PROJECT_ID, CONTEXT);

		assert.deepStrictEqual(questions, ["Tell me about Project Overview"]);
	});

	void it("excludes file name page nodes from suggestions even if they have content", async () => {
		const filePageWithContent = KnowledgeNodeEntity.initialize({
			contentJson: [{ content: "Specification details", type: "paragraph" }],
			createdAt: new Date(),
			id: NODE_ID_ONE,
			parentId: null,
			position: POSITION_ONE,
			projectId: PROJECT_ID,
			title: "spec.pdf",
			type: KnowledgeNodeType.PAGE,
			updatedAt: new Date(),
		});

		const { service } = createTestSetup([filePageWithContent]);

		const questions = await service.getSuggestedQuestions(PROJECT_ID, CONTEXT);

		assert.deepStrictEqual(questions, [...DEFAULT_SUGGESTED_QUESTIONS]);
	});

	void it("excludes nodes with missing or empty title from suggestions", async () => {
		const nodeWithoutTitle = KnowledgeNodeEntity.initialize({
			contentJson: [{ content: "Some content", type: "paragraph" }],
			createdAt: new Date(),
			id: NODE_ID_ONE,
			parentId: null,
			position: POSITION_ONE,
			projectId: PROJECT_ID,
			title: null as unknown as string,
			type: KnowledgeNodeType.ENTRY,
			updatedAt: new Date(),
		});

		const { service } = createTestSetup([nodeWithoutTitle]);

		const questions = await service.getSuggestedQuestions(PROJECT_ID, CONTEXT);

		assert.deepStrictEqual(questions, [...DEFAULT_SUGGESTED_QUESTIONS]);
	});

	void it("formats action statement clauses with how and inserts missing article for suggested questions", async () => {
		const entryNodeOne = KnowledgeNodeEntity.initialize({
			contentJson: [
				{
					content: "Converts documents into a unified knowledge base",
					type: "paragraph",
				},
			],
			createdAt: new Date(),
			id: NODE_ID_ONE,
			parentId: null,
			position: POSITION_ONE,
			projectId: PROJECT_ID,
			title:
				"KnowledgePrism converts scattered docs into unified knowledge base",
			type: KnowledgeNodeType.ENTRY,
			updatedAt: new Date(),
		});

		const entryNodeTwo = KnowledgeNodeEntity.initialize({
			contentJson: [
				{
					content: "Ensures a single source of truth across teams",
					type: "paragraph",
				},
			],
			createdAt: new Date(),
			id: NODE_ID_TWO,
			parentId: null,
			position: POSITION_TWO,
			projectId: PROJECT_ID,
			title: "KnowledgePrism ensures a single source of truth",
			type: KnowledgeNodeType.ENTRY,
			updatedAt: new Date(),
		});

		const { service } = createTestSetup([entryNodeOne, entryNodeTwo]);

		const questions = await service.getSuggestedQuestions(PROJECT_ID, CONTEXT);

		assert.deepStrictEqual(questions, [
			"Tell me about how KnowledgePrism converts scattered docs into a unified knowledge base",
			"Tell me about how KnowledgePrism ensures a single source of truth",
		]);
	});
});

void describe("AskPrismService search limits", () => {
	void it("defines MAX_SIMILAR_NODES as 3", () => {
		assert.strictEqual(MAX_SIMILAR_NODES, EXPECTED_SIMILAR_NODES_LIMIT);
	});

	void it("retrieves at most MAX_SIMILAR_NODES matches when more candidates exist", () => {
		const candidates = [
			{
				item: "Topic 1",
				vector: [COMPONENT_ONE, COMPONENT_ZERO],
			},
			{
				item: "Topic 2",
				vector: [COMPONENT_FRACTION_NINE, COMPONENT_FRACTION_ONE],
			},
			{
				item: "Topic 3",
				vector: [COMPONENT_FRACTION_EIGHT, COMPONENT_FRACTION_TWO],
			},
			{
				item: "Topic 4",
				vector: [COMPONENT_FRACTION_SEVEN, COMPONENT_FRACTION_THREE],
			},
			{
				item: "Topic 5",
				vector: [COMPONENT_FRACTION_SIX, COMPONENT_FRACTION_FOUR],
			},
		];

		const matches = search({
			candidates,
			queryVector: [COMPONENT_ONE, COMPONENT_ZERO],
			topK: MAX_SIMILAR_NODES,
		});

		assert.strictEqual(matches.length, MAX_SIMILAR_NODES);
		assert.deepStrictEqual(
			matches.map((match) => match.item),
			["Topic 1", "Topic 2", "Topic 3"],
		);
	});
});

void describe("AskPrismService.generateAnswer", () => {
	void it("returns the not-found message when the project has no knowledge", async () => {
		const { service } = createTestSetup([]);

		const response = await service.generateAnswer(
			PROJECT_ID,
			QUESTION,
			CONTEXT,
		);

		assert.deepStrictEqual(response, {
			answer: RAG_FALLBACK_MESSAGE,
			sources: [],
		});
	});

	void it("returns the not-found message when every node is empty", async () => {
		const emptyPageNode = KnowledgeNodeEntity.initialize({
			contentJson: [],
			createdAt: new Date(),
			id: NODE_ID_ONE,
			parentId: null,
			position: POSITION_ONE,
			projectId: PROJECT_ID,
			title: "empty-document.pdf",
			type: KnowledgeNodeType.PAGE,
			updatedAt: new Date(),
		});

		const { service } = createTestSetup([emptyPageNode]);

		const response = await service.generateAnswer(
			PROJECT_ID,
			QUESTION,
			CONTEXT,
		);

		assert.deepStrictEqual(response, {
			answer: RAG_FALLBACK_MESSAGE,
			sources: [],
		});
	});
});
