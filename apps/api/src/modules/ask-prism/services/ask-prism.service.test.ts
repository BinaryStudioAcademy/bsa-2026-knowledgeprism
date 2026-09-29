import "./ask-prism.test-setup.js";

import { KnowledgeNodeType } from "@knowledgeprism/constants";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { KnowledgeNodeEntity } from "~/modules/knowledge/models/knowledge-node.entity.js";
import { type KnowledgeNodeRepository } from "~/modules/knowledge/repositories/knowledge-node.repository.js";
import {
	type ProjectAccessContext,
	type ProjectService,
} from "~/modules/projects/services/project.service.js";

import { DEFAULT_SUGGESTED_QUESTIONS } from "../libs/constants/default-suggested-questions.constant.js";
import { AskPrismService } from "./ask-prism.service.js";

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
});
