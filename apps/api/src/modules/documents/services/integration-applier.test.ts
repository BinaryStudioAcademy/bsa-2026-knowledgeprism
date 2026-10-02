import "~/test-setup.js";

import {
	DocumentErrorMessage,
	DocumentSourceType,
	DocumentStatus,
	IntegrationChangeType,
	IntegrationResolution,
	KnowledgeNodeType,
} from "@knowledgeprism/constants";
import { type ValueOf } from "@knowledgeprism/types";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { type Transaction } from "objection";

import { HTTPError } from "~/infrastructure/http/http.js";
import { KnowledgeNodeEntity } from "~/modules/knowledge/models/knowledge-node.entity.js";
import { type KnowledgeNodeRepository } from "~/modules/knowledge/repositories/knowledge-node.repository.js";

import { DocumentEntity } from "../models/document.entity.js";
import { IntegrationChangeEntity } from "../models/integration-change.entity.js";
import { type ExtractionItemRepository } from "../repositories/extraction-item.repository.js";
import { IntegrationApplier } from "./integration-applier.js";

const DOCUMENT_ID = 9;
const PROJECT_ID = 4;
const USER_ID = 2;
const EXISTING_PAGE_ID = 50;
const EXISTING_SECTION_ID = 70;
const EXISTING_ENTRY_ID = 51;
const SECOND_EXISTING_ENTRY_ID = 52;
const LAST_EXISTING_CHILD_POSITION = 3;
const SECOND_CHILD_OFFSET = 2;
const NEXT_ROOT_POSITION = 7;
const FIRST_APPENDED_POSITION = 4;
const SECOND_APPENDED_POSITION = 5;
const FIRST_CHANGE_ID = 101;
const SECOND_CHANGE_ID = 102;
const FIRST_POSITION = 0;
const SECOND_POSITION = 1;
const NEXT_ID_START = 1000;

type CreatedNode = {
	parentId: null | number;
	position: number;
	title: string;
	type: ValueOf<typeof KnowledgeNodeType>;
};

const toNode = (data: {
	contentJson?: { content: string; type: string }[];
	id: number;
	parentId: null | number;
	position: number;
	type: ValueOf<typeof KnowledgeNodeType>;
}): KnowledgeNodeEntity =>
	KnowledgeNodeEntity.initialize({
		contentJson: data.contentJson ?? [],
		createdAt: new Date(),
		projectId: PROJECT_ID,
		title: `Node ${String(data.id)}`,
		updatedAt: new Date(),
		...data,
	});

const EXISTING_NODES = [
	toNode({
		id: EXISTING_PAGE_ID,
		parentId: null,
		position: FIRST_POSITION,
		type: KnowledgeNodeType.PAGE,
	}),
	toNode({
		id: EXISTING_ENTRY_ID,
		parentId: EXISTING_PAGE_ID,
		position: LAST_EXISTING_CHILD_POSITION,
		type: KnowledgeNodeType.ENTRY,
	}),
	toNode({
		contentJson: [{ content: "Glossary text", type: "paragraph" }],
		id: SECOND_EXISTING_ENTRY_ID,
		parentId: null,
		position: LAST_EXISTING_CHILD_POSITION + SECOND_CHILD_OFFSET,
		type: KnowledgeNodeType.ENTRY,
	}),
	toNode({
		id: EXISTING_SECTION_ID,
		parentId: null,
		position: LAST_EXISTING_CHILD_POSITION,
		type: KnowledgeNodeType.SECTION,
	}),
];

const toChange = (
	id: number,
	title: string,
	matchedNodeId: null | number = null,
): IntegrationChangeEntity =>
	IntegrationChangeEntity.initialize({
		documentId: DOCUMENT_ID,
		explanation: "New knowledge.",
		extractionItemId: id,
		id,
		incomingContent: `${title} content`,
		incomingTitle: title,
		liveContent: matchedNodeId === null ? null : "",
		liveTitle: matchedNodeId === null ? null : `Node ${String(matchedNodeId)}`,
		matchedNodeId,
		placement: {
			matches: [],
			parentExtractionItemId: null,
			parentId: null,
			parentTitle: null,
			proposesParent: false,
			siblingOrder: null,
		},
		score: null,
		type:
			matchedNodeId === null
				? IntegrationChangeType.NEW
				: IntegrationChangeType.UPDATE,
	});

const DOCUMENT = DocumentEntity.initialize({
	content: null,
	contentHash: "hash",
	createdAt: new Date(),
	errorMessage: null,
	failedPageNumbers: [],
	id: DOCUMENT_ID,
	mimeType: "application/pdf",
	name: "Requirements.pdf",
	processingAttempt: 1,
	processingProgress: null,
	projectId: PROJECT_ID,
	s3Key: null,
	sizeInBytes: null,
	sourceType: DocumentSourceType.UPLOAD,
	status: DocumentStatus.WAITING_FOR_APPROVAL,
	updatedAt: new Date(),
	uploadedBy: USER_ID,
});

const createSetup = (): {
	applier: IntegrationApplier;
	created: CreatedNode[];
	updatedIds: number[];
	updatedTitles: string[];
} => {
	const created: CreatedNode[] = [];
	const updatedIds: number[] = [];
	const updatedTitles: string[] = [];
	let nextId = NEXT_ID_START;
	const knowledgeNodeRepository = {
		create: ({ entity }: { entity: KnowledgeNodeEntity }) => {
			const node = entity.toNewObject();
			created.push({
				parentId: node.parentId,
				position: node.position,
				title: node.title,
				type: node.type,
			});
			nextId++;

			return Promise.resolve(
				toNode({
					id: nextId,
					parentId: node.parentId,
					position: node.position,
					type: node.type,
				}),
			);
		},
		findAllByProjectId: () => Promise.resolve(EXISTING_NODES),
		findNextRootPosition: () => Promise.resolve(NEXT_ROOT_POSITION),
		lockByIdAndProjectId: ({ id }: { id: number }) =>
			Promise.resolve(EXISTING_NODES.find((node) => node.toObject().id === id)),
		update: ({ id, title }: { id: number; title: string }) => {
			updatedIds.push(id);
			updatedTitles.push(title);

			return Promise.resolve(
				EXISTING_NODES.find((node) => node.toObject().id === id),
			);
		},
	} as unknown as KnowledgeNodeRepository;
	const extractionItemRepository = {
		findByDocumentId: () => Promise.resolve([]),
		linkKnowledgeNode: () => Promise.resolve(),
	} as unknown as ExtractionItemRepository;

	return {
		applier: new IntegrationApplier({
			extractionItemRepository,
			knowledgeNodeRepository,
		}),
		created,
		updatedIds,
		updatedTitles,
	};
};

const apply = (
	applier: IntegrationApplier,
	placements: { changeId: number; parentId: null | number; position: number }[],
): Promise<void> =>
	applier.apply(
		{
			changes: [
				toChange(FIRST_CHANGE_ID, "Glossary"),
				toChange(SECOND_CHANGE_ID, "Roles"),
			],
			contentOverrides: [],
			document: DOCUMENT,
			placements,
			resolutions: [],
			userId: USER_ID,
		},
		{} as Transaction,
	);

void describe("IntegrationApplier placements", () => {
	void it("files new sections under a new page for the document by default", async () => {
		const { applier, created } = createSetup();

		await apply(applier, []);

		const [page, ...entries] = created;
		assert.equal(page?.type, KnowledgeNodeType.PAGE);
		assert.equal(page.title, "Requirements.pdf");
		assert.deepEqual(
			entries.map(({ position, title }) => [title, position]),
			[
				["Glossary", FIRST_POSITION],
				["Roles", SECOND_POSITION],
			],
		);
	});

	void it("files sections under the chosen page after its existing children", async () => {
		const { applier, created } = createSetup();

		await apply(applier, [
			{ changeId: FIRST_CHANGE_ID, parentId: EXISTING_PAGE_ID, position: 0 },
			{ changeId: SECOND_CHANGE_ID, parentId: EXISTING_PAGE_ID, position: 1 },
		]);

		assert.equal(
			created.some((node) => node.type === KnowledgeNodeType.PAGE),
			false,
		);
		assert.deepEqual(
			created.map(({ parentId, position, title }) => [
				title,
				parentId,
				position,
			]),
			[
				["Glossary", EXISTING_PAGE_ID, FIRST_APPENDED_POSITION],
				["Roles", EXISTING_PAGE_ID, SECOND_APPENDED_POSITION],
			],
		);
	});

	void it("files sections under a chosen section-type document", async () => {
		const { applier, created } = createSetup();

		await apply(applier, [
			{ changeId: FIRST_CHANGE_ID, parentId: EXISTING_SECTION_ID, position: 0 },
		]);

		assert.equal(
			created.find(({ title }) => title === "Glossary")?.parentId,
			EXISTING_SECTION_ID,
		);
	});

	void it("orders sections by their chosen positions", async () => {
		const { applier, created } = createSetup();

		await apply(applier, [
			{ changeId: FIRST_CHANGE_ID, parentId: null, position: 1 },
			{ changeId: SECOND_CHANGE_ID, parentId: null, position: 0 },
		]);

		assert.deepEqual(
			created
				.filter((node) => node.type === KnowledgeNodeType.ENTRY)
				.map(({ title }) => title),
			["Roles", "Glossary"],
		);
	});

	void it("rejects a placement under a node that is not a page", async () => {
		const { applier } = createSetup();

		await assert.rejects(
			apply(applier, [
				{ changeId: FIRST_CHANGE_ID, parentId: EXISTING_ENTRY_ID, position: 0 },
			]),
			(error: unknown) =>
				error instanceof HTTPError &&
				error.message === DocumentErrorMessage.INVALID_PLACEMENT,
		);
	});

	void it("files a second update of the same entry as a new section instead of rejecting", async () => {
		const { applier, created, updatedIds } = createSetup();

		await applier.apply(
			{
				changes: [
					toChange(FIRST_CHANGE_ID, "Glossary", EXISTING_ENTRY_ID),
					toChange(SECOND_CHANGE_ID, "Roles", EXISTING_ENTRY_ID),
				],
				contentOverrides: [],
				document: DOCUMENT,
				placements: [],
				resolutions: [],
				userId: USER_ID,
			},
			{} as Transaction,
		);

		assert.deepEqual(updatedIds, [EXISTING_ENTRY_ID]);
		assert.deepEqual(
			created
				.filter((node) => node.type === KnowledgeNodeType.ENTRY)
				.map(({ title }) => title),
			["Roles"],
		);
	});

	void it("applies a Merge both content choice once and still honours the title choice", async () => {
		const { applier, updatedTitles } = createSetup();

		await applier.apply(
			{
				changes: [toChange(FIRST_CHANGE_ID, "Glossary", EXISTING_ENTRY_ID)],
				contentOverrides: [],
				document: DOCUMENT,
				placements: [],
				resolutions: [
					{
						changeId: FIRST_CHANGE_ID,
						content: IntegrationResolution.BOTH,
						title: IntegrationResolution.USE_NEW,
					},
				],
				userId: USER_ID,
			},
			{} as Transaction,
		);

		assert.deepEqual(updatedTitles, ["Glossary"]);
	});

	void it("updates strictly the chosen match entry when matchIndex 1 is selected", async () => {
		const { applier, updatedIds } = createSetup();

		const changeWithMatches = IntegrationChangeEntity.initialize({
			documentId: DOCUMENT_ID,
			explanation: "Multiple match candidate.",
			extractionItemId: FIRST_CHANGE_ID,
			id: FIRST_CHANGE_ID,
			incomingContent: "Updated Glossary content",
			incomingTitle: "Glossary",
			liveContent: "Glossary text",
			liveTitle: `Node ${String(SECOND_EXISTING_ENTRY_ID)}`,
			matchedNodeId: EXISTING_ENTRY_ID,
			placement: {
				matches: [
					{
						content: "Glossary text",
						nodeId: EXISTING_ENTRY_ID,
						span: "Glossary",
						title: `Node ${String(EXISTING_ENTRY_ID)}`,
					},
					{
						content: "Glossary text",
						nodeId: SECOND_EXISTING_ENTRY_ID,
						span: "Glossary",
						title: `Node ${String(SECOND_EXISTING_ENTRY_ID)}`,
					},
				],
				parentExtractionItemId: null,
				parentId: null,
				parentTitle: null,
				proposesParent: false,
				siblingOrder: null,
			},
			score: null,
			type: IntegrationChangeType.UPDATE,
		});

		await applier.apply(
			{
				changes: [changeWithMatches],
				contentOverrides: [],
				document: DOCUMENT,
				placements: [],
				resolutions: [
					{
						changeId: FIRST_CHANGE_ID,
						content: IntegrationResolution.USE_NEW,
						matchIndex: 1,
						title: IntegrationResolution.USE_NEW,
					},
				],
				userId: USER_ID,
			},
			{} as Transaction,
		);

		assert.deepEqual(updatedIds, [SECOND_EXISTING_ENTRY_ID]);
	});
});
