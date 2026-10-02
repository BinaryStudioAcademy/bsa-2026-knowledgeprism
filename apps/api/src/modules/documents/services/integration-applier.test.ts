import "~/test-setup.js";

import {
	DocumentErrorMessage,
	DocumentSourceType,
	DocumentStatus,
	IntegrationChangeType,
	IntegrationResolution,
	KnowledgeNodeType,
} from "@knowledgeprism/constants";
import {
	type IntegrationChangesApplyRequestDto,
	type ValueOf,
} from "@knowledgeprism/types";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { type Transaction } from "objection";

import { HTTPError } from "~/infrastructure/http/http.js";
import { KnowledgeNodeEntity } from "~/modules/knowledge/models/knowledge-node.entity.js";
import { type KnowledgeNodeRepository } from "~/modules/knowledge/repositories/knowledge-node.repository.js";

import { DocumentEntity } from "../models/document.entity.js";
import { IntegrationChangeEntity } from "../models/integration-change.entity.js";
import { type ExtractionItemRepository } from "../repositories/extraction-item.repository.js";
import {
	IntegrationAnalysisOutdatedError,
	IntegrationApplier,
} from "./integration-applier.js";

const DOCUMENT_ID = 9;
const PROJECT_ID = 4;
const OTHER_PROJECT_ID = 5;
const USER_ID = 2;
const EXISTING_PAGE_ID = 50;
const EXISTING_SECTION_ID = 70;
const EXISTING_ENTRY_ID = 51;
const EXISTING_CHILD_ID = 52;
const SECOND_EXISTING_ENTRY_ID = 53;
const LAST_EXISTING_CHILD_POSITION = 3;
const SECOND_CHILD_OFFSET = 2;
const NEXT_ROOT_POSITION = 7;
const FIRST_APPENDED_POSITION = 4;
const SECOND_APPENDED_POSITION = 5;
const FIRST_CHANGE_ID = 101;
const SECOND_CHANGE_ID = 102;
const THIRD_CHANGE_ID = 103;
const FIRST_ITEM_ID = 201;
const SECOND_ITEM_ID = 202;
const THIRD_ITEM_ID = 203;
const FIRST_POSITION = 0;
const SECOND_POSITION = 1;
const NEXT_ID_START = 1000;

type CreatedNode = {
	id: number;
	parentId: null | number;
	position: number;
	title: string;
	type: ValueOf<typeof KnowledgeNodeType>;
};

const toNestedChange = ({
	extractionItemId,
	id,
	parentExtractionItemId,
}: {
	extractionItemId: number;
	id: number;
	parentExtractionItemId: null | number;
}): IntegrationChangeEntity => {
	const change = toChange(id, `Item ${String(extractionItemId)}`).toObject();

	return IntegrationChangeEntity.initialize({
		...change,
		extractionItemId,
		placement: { ...change.placement, parentExtractionItemId },
	});
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
		id: EXISTING_CHILD_ID,
		parentId: EXISTING_ENTRY_ID,
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

const createSetup = (
	existingNodes = EXISTING_NODES,
): {
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
			nextId++;
			created.push({
				id: nextId,
				parentId: node.parentId,
				position: node.position,
				title: node.title,
				type: node.type,
			});

			return Promise.resolve(
				toNode({
					id: nextId,
					parentId: node.parentId,
					position: node.position,
					type: node.type,
				}),
			);
		},
		findAllByProjectId: (projectId: number) =>
			Promise.resolve(
				existingNodes.filter((node) => node.toObject().projectId === projectId),
			),
		findNextRootPosition: () => Promise.resolve(NEXT_ROOT_POSITION),
		lockByIdAndProjectId: ({
			id,
			projectId,
		}: {
			id: number;
			projectId: number;
		}) =>
			Promise.resolve(
				existingNodes.find((node) => {
					const details = node.toObject();

					return details.id === id && details.projectId === projectId;
				}),
			),
		update: ({ id, title }: { id: number; title: string }) => {
			updatedIds.push(id);
			updatedTitles.push(title);

			return Promise.resolve(
				existingNodes.find((node) => node.toObject().id === id),
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
	placements: NonNullable<IntegrationChangesApplyRequestDto["placements"]>,
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
	for (const type of [
		IntegrationChangeType.UPDATE,
		IntegrationChangeType.DUPLICATE,
		IntegrationChangeType.CONFLICT,
	]) {
		void it(`preserves nested children under a reused ${type} parent`, async () => {
			const { applier, created, updatedIds } = createSetup();
			const parent = IntegrationChangeEntity.initialize({
				...toChange(FIRST_CHANGE_ID, "Parent", EXISTING_ENTRY_ID).toObject(),
				extractionItemId: FIRST_ITEM_ID,
				type,
			});

			await applier.apply(
				{
					changes: [
						toNestedChange({
							extractionItemId: THIRD_ITEM_ID,
							id: THIRD_CHANGE_ID,
							parentExtractionItemId: SECOND_ITEM_ID,
						}),
						toNestedChange({
							extractionItemId: SECOND_ITEM_ID,
							id: SECOND_CHANGE_ID,
							parentExtractionItemId: FIRST_ITEM_ID,
						}),
						parent,
					],
					contentOverrides: [],
					document: DOCUMENT,
					placements: [
						{
							changeId: THIRD_CHANGE_ID,
							parentExtractionItemId: SECOND_ITEM_ID,
							parentId: null,
							position: FIRST_POSITION,
						},
						{
							changeId: SECOND_CHANGE_ID,
							parentExtractionItemId: FIRST_ITEM_ID,
							parentId: null,
							position: SECOND_POSITION,
						},
					],
					resolutions:
						type === IntegrationChangeType.CONFLICT
							? [
									{
										changeId: FIRST_CHANGE_ID,
										content: IntegrationResolution.KEEP,
										title: IntegrationResolution.KEEP,
									},
								]
							: [],
					userId: USER_ID,
				},
				{} as Transaction,
			);

			const [child, grandchild] = created;
			assert.ok(child && grandchild);
			assert.deepEqual(
				created.map(({ parentId, position, title, type: nodeType }) => ({
					parentId,
					position,
					title,
					type: nodeType,
				})),
				[
					{
						parentId: EXISTING_ENTRY_ID,
						position: FIRST_APPENDED_POSITION,
						title: `Item ${String(SECOND_ITEM_ID)}`,
						type: KnowledgeNodeType.ENTRY,
					},
					{
						parentId: child.id,
						position: FIRST_POSITION,
						title: `Item ${String(THIRD_ITEM_ID)}`,
						type: KnowledgeNodeType.ENTRY,
					},
				],
			);
			assert.deepEqual(
				updatedIds,
				type === IntegrationChangeType.UPDATE ? [EXISTING_ENTRY_ID] : [],
			);
		});
	}

	void it("keeps children under an update that becomes a new entry after a competing write", async () => {
		const { applier, created } = createSetup();

		await applier.apply(
			{
				changes: [
					toChange(FIRST_CHANGE_ID, "First parent", EXISTING_ENTRY_ID),
					toChange(SECOND_CHANGE_ID, "Second parent", EXISTING_ENTRY_ID),
					toNestedChange({
						extractionItemId: THIRD_ITEM_ID,
						id: THIRD_CHANGE_ID,
						parentExtractionItemId: SECOND_CHANGE_ID,
					}),
				],
				contentOverrides: [],
				document: DOCUMENT,
				placements: [
					{
						changeId: THIRD_CHANGE_ID,
						parentExtractionItemId: SECOND_CHANGE_ID,
						parentId: null,
						position: FIRST_POSITION,
					},
				],
				resolutions: [],
				userId: USER_ID,
			},
			{} as Transaction,
		);

		const parent = created.find(({ title }) => title === "Second parent");
		const child = created.find(
			({ title }) => title === `Item ${String(THIRD_ITEM_ID)}`,
		);
		assert.ok(parent && child);
		assert.equal(child.parentId, parent.id);
		assert.notEqual(child.parentId, EXISTING_ENTRY_ID);
	});

	void it("rejects an incoming parent matched to a node in another project", async () => {
		const { applier, created } = createSetup(
			EXISTING_NODES.map((node) => {
				const details = node.toObject();

				return KnowledgeNodeEntity.initialize({
					...details,
					createdAt: new Date(details.createdAt),
					projectId: OTHER_PROJECT_ID,
					updatedAt: new Date(details.updatedAt),
				});
			}),
		);

		await assert.rejects(
			applier.apply(
				{
					changes: [
						toChange(FIRST_CHANGE_ID, "Parent", EXISTING_ENTRY_ID),
						toNestedChange({
							extractionItemId: SECOND_ITEM_ID,
							id: SECOND_CHANGE_ID,
							parentExtractionItemId: FIRST_CHANGE_ID,
						}),
					],
					contentOverrides: [],
					document: DOCUMENT,
					placements: [
						{
							changeId: SECOND_CHANGE_ID,
							parentExtractionItemId: FIRST_CHANGE_ID,
							parentId: null,
							position: FIRST_POSITION,
						},
					],
					resolutions: [],
					userId: USER_ID,
				},
				{} as Transaction,
			),
			IntegrationAnalysisOutdatedError,
		);
		assert.deepEqual(created, []);
	});

	void it("persists three nested levels even when children precede their parents", async () => {
		const { applier, created } = createSetup();
		const changes = [
			toNestedChange({
				extractionItemId: THIRD_ITEM_ID,
				id: THIRD_CHANGE_ID,
				parentExtractionItemId: SECOND_ITEM_ID,
			}),
			toNestedChange({
				extractionItemId: SECOND_ITEM_ID,
				id: SECOND_CHANGE_ID,
				parentExtractionItemId: FIRST_ITEM_ID,
			}),
			toNestedChange({
				extractionItemId: FIRST_ITEM_ID,
				id: FIRST_CHANGE_ID,
				parentExtractionItemId: null,
			}),
		];

		await applier.apply(
			{
				changes,
				contentOverrides: [],
				document: DOCUMENT,
				placements: [
					{
						changeId: THIRD_CHANGE_ID,
						parentExtractionItemId: SECOND_ITEM_ID,
						parentId: null,
						position: FIRST_POSITION,
					},
					{
						changeId: SECOND_CHANGE_ID,
						parentExtractionItemId: FIRST_ITEM_ID,
						parentId: null,
						position: SECOND_POSITION,
					},
					{
						changeId: FIRST_CHANGE_ID,
						parentExtractionItemId: null,
						parentId: EXISTING_PAGE_ID,
						position: SECOND_POSITION,
					},
				],
				resolutions: [],
				userId: USER_ID,
			},
			{} as Transaction,
		);

		const [parent, child, grandchild] = created;
		assert.ok(parent && child && grandchild);
		assert.deepEqual(
			created.map(({ parentId, title }) => [title, parentId]),
			[
				[`Item ${String(FIRST_ITEM_ID)}`, EXISTING_PAGE_ID],
				[`Item ${String(SECOND_ITEM_ID)}`, parent.id],
				[`Item ${String(THIRD_ITEM_ID)}`, child.id],
			],
		);
		assert.equal(child.position, FIRST_POSITION);
		assert.equal(grandchild.position, FIRST_POSITION);
	});

	void it("rejects a missing incoming parent before creating any nodes", async () => {
		const { applier, created } = createSetup();

		await assert.rejects(
			apply(applier, [
				{
					changeId: FIRST_CHANGE_ID,
					parentExtractionItemId: THIRD_ITEM_ID,
					parentId: null,
					position: FIRST_POSITION,
				},
			]),
			HTTPError,
		);
		assert.deepEqual(created, []);
	});

	void it("distinguishes incoming item identifiers from existing knowledge node identifiers", async () => {
		const { applier, created } = createSetup();

		await applier.apply(
			{
				changes: [
					toNestedChange({
						extractionItemId: EXISTING_PAGE_ID,
						id: FIRST_CHANGE_ID,
						parentExtractionItemId: null,
					}),
					toNestedChange({
						extractionItemId: SECOND_ITEM_ID,
						id: SECOND_CHANGE_ID,
						parentExtractionItemId: EXISTING_PAGE_ID,
					}),
				],
				contentOverrides: [],
				document: DOCUMENT,
				placements: [
					{
						changeId: FIRST_CHANGE_ID,
						parentId: null,
						position: FIRST_POSITION,
					},
					{
						changeId: SECOND_CHANGE_ID,
						parentExtractionItemId: EXISTING_PAGE_ID,
						parentId: null,
						position: SECOND_POSITION,
					},
				],
				resolutions: [],
				userId: USER_ID,
			},
			{} as Transaction,
		);

		const incomingParent = created.find(
			({ title }) => title === `Item ${String(EXISTING_PAGE_ID)}`,
		);
		const child = created.find(
			({ title }) => title === `Item ${String(SECOND_ITEM_ID)}`,
		);
		assert.ok(incomingParent && child);
		assert.equal(child.parentId, incomingParent.id);
		assert.notEqual(child.parentId, EXISTING_PAGE_ID);
	});

	void it("rejects cycles between incoming parents before creating any nodes", async () => {
		const { applier, created } = createSetup();

		await assert.rejects(
			apply(applier, [
				{
					changeId: FIRST_CHANGE_ID,
					parentExtractionItemId: SECOND_CHANGE_ID,
					parentId: null,
					position: FIRST_POSITION,
				},
				{
					changeId: SECOND_CHANGE_ID,
					parentExtractionItemId: FIRST_CHANGE_ID,
					parentId: null,
					position: SECOND_POSITION,
				},
			]),
			HTTPError,
		);
		assert.deepEqual(created, []);
	});

	void it("rejects placements for a change outside the published document", async () => {
		const { applier, created } = createSetup();

		await assert.rejects(
			apply(applier, [
				{ changeId: THIRD_CHANGE_ID, parentId: null, position: FIRST_POSITION },
			]),
			HTTPError,
		);
		assert.deepEqual(created, []);
	});

	void it("rejects self-referencing incoming parents", async () => {
		const { applier, created } = createSetup();

		await assert.rejects(
			apply(applier, [
				{
					changeId: FIRST_CHANGE_ID,
					parentExtractionItemId: FIRST_CHANGE_ID,
					parentId: null,
					position: FIRST_POSITION,
				},
			]),
			HTTPError,
		);
		assert.deepEqual(created, []);
	});

	void it("rejects duplicate placement decisions for the same change", async () => {
		const { applier, created } = createSetup();
		const placement = {
			changeId: FIRST_CHANGE_ID,
			parentId: null,
			position: FIRST_POSITION,
		};

		await assert.rejects(apply(applier, [placement, placement]), HTTPError);
		assert.deepEqual(created, []);
	});

	void it("rejects an existing parent outside the project", async () => {
		const { applier, created } = createSetup();

		await assert.rejects(
			apply(applier, [
				{
					changeId: FIRST_CHANGE_ID,
					parentId: THIRD_ITEM_ID,
					position: FIRST_POSITION,
				},
			]),
			(error: unknown) =>
				error instanceof HTTPError &&
				error.message === DocumentErrorMessage.INVALID_PLACEMENT,
		);
		assert.deepEqual(created, []);
	});

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
