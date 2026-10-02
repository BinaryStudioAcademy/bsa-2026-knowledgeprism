import "~/test-setup.js";

import { HTTPCode, KnowledgeNodeType } from "@knowledgeprism/constants";
import { type KnowledgeEntryResponseDto } from "@knowledgeprism/types";
import knex from "knex";
import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import { knexSnakeCaseMappers } from "objection";

import { type Database } from "~/infrastructure/database/database.js";
import { HTTPError } from "~/infrastructure/http/http.js";
import { type Logger } from "~/infrastructure/logger/logger.js";
import { type ProjectService } from "~/modules/projects/services/project.service.js";

import { KnowledgeNodeEntity } from "../models/knowledge-node.entity.js";
import { KnowledgeNodeModel } from "../models/knowledge-node.model.js";
import { KnowledgeNodeRepository } from "../repositories/knowledge-node.repository.js";
import { KnowledgeService } from "./knowledge.service.js";

const PROJECT_ID = 3;
const DOCUMENT_ID = 10;
const FIRST_SECTION_ID = 20;
const SECOND_SECTION_ID = 21;
const CHILD_SECTION_ID = 40;
const GRANDCHILD_SECTION_ID = 41;
const SINGLE_CALL_COUNT = 1;
const EMPTY_COUNT = 0;
const FIRST_CALL_INDEX = 0;
const CONTEXT = { organisationId: 1, userId: 2 };
const REQUEST = {
	context: CONTEXT,
	documentId: DOCUMENT_ID,
	projectId: PROJECT_ID,
};

const createNode = (
	id: number,
	type: KnowledgeEntryResponseDto["type"],
	parentId: null | number = null,
): KnowledgeNodeEntity =>
	KnowledgeNodeEntity.initialize({
		contentJson: [
			{
				content: [{ text: `Content ${String(id)}`, type: "text" }],
				type: "paragraph",
			},
		],
		createdAt: new Date("2026-10-02T00:00:00.000Z"),
		id,
		parentId,
		position: 0,
		projectId: PROJECT_ID,
		title: `Node ${String(id)}`,
		type,
		updatedAt: new Date("2026-10-02T00:00:00.000Z"),
	});

const createSetup = (
	document: KnowledgeNodeEntity | null,
	sections: KnowledgeNodeEntity[] = [],
) => {
	const readDocument = mock.fn((id: number, projectId: number) => {
		assert.equal(id, DOCUMENT_ID);
		assert.equal(projectId, PROJECT_ID);
		return Promise.resolve(document);
	});
	const readSections = mock.fn(
		(reference: { parentId: number; projectId: number }) => {
			assert.deepEqual(reference, {
				parentId: DOCUMENT_ID,
				projectId: PROJECT_ID,
			});
			return Promise.resolve(sections);
		},
	);
	const authorize = mock.fn((projectId: number, context: typeof CONTEXT) => {
		assert.equal(projectId, PROJECT_ID);
		assert.deepEqual(context, CONTEXT);
		return Promise.resolve();
	});
	const service = new KnowledgeService({
		database: {} as Database,
		knowledgeNodeRepository: {
			findByIdAndProjectId: readDocument,
			findEntriesByDocumentId: readSections,
		} as unknown as KnowledgeNodeRepository,
		logger: {} as Logger,
		projectService: {
			assertProjectAccess: authorize,
		} as unknown as ProjectService,
	});

	return { authorize, readDocument, readSections, service };
};

void describe("knowledge document sections", () => {
	void it("returns the document first and preserves section order and content", async () => {
		const document = createNode(DOCUMENT_ID, KnowledgeNodeType.PAGE);
		const sections = [
			createNode(FIRST_SECTION_ID, KnowledgeNodeType.ENTRY, DOCUMENT_ID),
			createNode(SECOND_SECTION_ID, KnowledgeNodeType.ENTRY, DOCUMENT_ID),
		];
		const { authorize, readDocument, readSections, service } = createSetup(
			document,
			sections,
		);

		assert.deepEqual(await service.findDocumentSections(REQUEST), {
			items: [document, ...sections].map((node) => node.toObject()),
		});
		assert.equal(authorize.mock.callCount(), SINGLE_CALL_COUNT);
		assert.equal(readDocument.mock.callCount(), SINGLE_CALL_COUNT);
		assert.equal(readSections.mock.callCount(), SINGLE_CALL_COUNT);
		assert.deepEqual(readSections.mock.calls[FIRST_CALL_INDEX]?.arguments, [
			{ parentId: DOCUMENT_ID, projectId: PROJECT_ID },
		]);
	});

	void it("rejects project access before reading any document content", async () => {
		const { authorize, readDocument, readSections, service } =
			createSetup(null);
		const forbidden = new HTTPError({
			message: "Forbidden",
			status: HTTPCode.FORBIDDEN,
		});
		authorize.mock.mockImplementation(() => Promise.reject(forbidden));

		await assert.rejects(
			service.findDocumentSections(REQUEST),
			(error) => error === forbidden,
		);
		assert.equal(readDocument.mock.callCount(), EMPTY_COUNT);
		assert.equal(readSections.mock.callCount(), EMPTY_COUNT);
	});

	void it("returns not found without reading sections when the project has no such document", async () => {
		const { readSections, service } = createSetup(null);

		await assert.rejects(
			service.findDocumentSections(REQUEST),
			(error) =>
				error instanceof HTTPError && error.status === HTTPCode.NOT_FOUND,
		);
		assert.equal(readSections.mock.callCount(), EMPTY_COUNT);
	});

	void it("rejects an entry ID rather than treating it as a document", async () => {
		const { readSections, service } = createSetup(
			createNode(DOCUMENT_ID, KnowledgeNodeType.ENTRY),
		);

		await assert.rejects(
			service.findDocumentSections(REQUEST),
			(error) =>
				error instanceof HTTPError && error.status === HTTPCode.NOT_FOUND,
		);
		assert.equal(readSections.mock.callCount(), EMPTY_COUNT);
	});

	void it("can read a document with no sections", async () => {
		const page = createNode(DOCUMENT_ID, KnowledgeNodeType.PAGE);
		const { service } = createSetup(page);

		assert.deepEqual(await service.findDocumentSections(REQUEST), {
			items: [page.toObject()],
		});
	});

	void it("reads nested entries in tree order with project boundaries on both recursive query branches", async () => {
		const connection = knex({ client: "pg", ...knexSnakeCaseMappers() });
		const query = KnowledgeNodeModel.query();
		query.knex(connection);
		const queryStub = mock.method(KnowledgeNodeModel, "query", () => query);
		const nodes = [
			createNode(FIRST_SECTION_ID, KnowledgeNodeType.ENTRY, DOCUMENT_ID),
			createNode(CHILD_SECTION_ID, KnowledgeNodeType.ENTRY, FIRST_SECTION_ID),
			createNode(
				GRANDCHILD_SECTION_ID,
				KnowledgeNodeType.ENTRY,
				CHILD_SECTION_ID,
			),
			createNode(SECOND_SECTION_ID, KnowledgeNodeType.ENTRY, DOCUMENT_ID),
		];
		const rows = nodes.toReversed().map((entity) => {
			const node = entity.toObject();

			return KnowledgeNodeModel.fromJson({
				...node,
				createdAt: new Date(node.createdAt),
				updatedAt: new Date(node.updatedAt),
			});
		});
		const executeStub = mock.method(query, "execute", () =>
			Promise.resolve(rows),
		);

		try {
			const repository = new KnowledgeNodeRepository(KnowledgeNodeModel);
			const sections = await repository.findEntriesByDocumentId({
				parentId: DOCUMENT_ID,
				projectId: PROJECT_ID,
			});
			assert.deepEqual(
				sections.map((node) => node.toObject()),
				nodes.map((node) => node.toObject()),
			);
			const compiled = query.toKnexQuery().toSQL();

			assert.equal(queryStub.mock.callCount(), SINGLE_CALL_COUNT);
			assert.equal(executeStub.mock.callCount(), SINGLE_CALL_COUNT);
			assert.match(
				compiled.sql,
				/where "parent_id" = \? and "project_id" = \? and "type" = \?/u,
			);
			assert.deepEqual(compiled.bindings, [
				DOCUMENT_ID,
				PROJECT_ID,
				KnowledgeNodeType.ENTRY,
				PROJECT_ID,
				KnowledgeNodeType.ENTRY,
			]);
			assert.match(compiled.sql, /with recursive "document_entries" as/u);
			assert.match(
				compiled.sql,
				/"child_entry"\."parent_id" = "parent_entry"\."id" where "child_entry"\."project_id" = \? and "child_entry"\."type" = \?/u,
			);
			assert.doesNotMatch(compiled.sql, /union all/u);
		} finally {
			executeStub.mock.restore();
			queryStub.mock.restore();
			await connection.destroy();
		}
	});
});
