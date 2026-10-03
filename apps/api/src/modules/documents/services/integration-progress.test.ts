import "~/test-setup.js";

import {
	DocumentProcessingPhase,
	DocumentSourceType,
	DocumentStatus,
	ExtractionItemStatus,
	IntegrationChangeType,
} from "@knowledgeprism/constants";
import {
	type DocumentProcessingProgressDto,
	type ValueOf,
} from "@knowledgeprism/types";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { type Transaction } from "objection";

import { type Database } from "~/infrastructure/database/database.js";
import { type KnowledgeNodeRepository } from "~/modules/knowledge/repositories/knowledge-node.repository.js";

import { DocumentEntity } from "../models/document.entity.js";
import { ExtractionItemEntity } from "../models/extraction-item.entity.js";
import { type IntegrationChangeEntity } from "../models/integration-change.entity.js";
import { type DocumentRepository } from "../repositories/document.repository.js";
import { type ExtractionItemRepository } from "../repositories/extraction-item.repository.js";
import { type IntegrationChangeRepository } from "../repositories/integration-change.repository.js";
import { IntegrationAnalyzer } from "./integration-analyzer.js";

const DOCUMENT_ID = 7;
const ignoreLog = (): void => {};
const PROJECT_ID = 3;
const ATTEMPT = 2;
const FIRST_ITEM_ID = 1;
const SECOND_ITEM_ID = 2;
const THIRD_ITEM_ID = 3;
const ZERO_COUNT = 0;
const SINGLE_COUNT = 1;
const TWO_COUNT = 2;
const FIRST_SECTION_ID = 10;
const SECOND_SECTION_ID = 20;
const FIRST_PARAMETER_INDEX = 0;
const FIRST_SECTION_INDEX = 0;
const LAST_SECTION_INDEX = 2;

const createItem = (
	id: number,
	text: string,
	{
		extractionSectionId = null,
		status = ExtractionItemStatus.APPROVED,
	}: {
		extractionSectionId?: null | number;
		status?: ValueOf<typeof ExtractionItemStatus>;
	} = {},
): ExtractionItemEntity =>
	ExtractionItemEntity.initialize({
		confidence: 1,
		documentId: DOCUMENT_ID,
		extractionSectionId,
		heading: null,
		id,
		knowledgeNodeId: null,
		position: id,
		rationale: "Source",
		sourceExcerpt: text,
		sourcePageNumber: 1,
		status,
		text,
		title: "",
	});

const createSetup = (items: ExtractionItemEntity[], isCurrent = true) => {
	const candidateCountByText = new Map<string, number>();
	const outlinedSections: string[][] = [];
	const persistedChanges: IntegrationChangeEntity[] = [];
	const updates: Parameters<
		DocumentRepository["updateProcessingProgress"]
	>[typeof FIRST_PARAMETER_INDEX][] = [];
	const transitions: Parameters<
		DocumentRepository["compareAndSwapStatus"]
	>[typeof FIRST_PARAMETER_INDEX][] = [];
	const persistedCounts: number[] = [];
	const projects: number[] = [];
	const document = DocumentEntity.initializeNew({
		content: null,
		contentHash: null,
		errorMessage: null,
		mimeType: "text/plain",
		name: "source.txt",
		projectId: PROJECT_ID,
		s3Key: null,
		sizeInBytes: null,
		sourceType: DocumentSourceType.MANUAL,
		status: DocumentStatus.INTEGRATING,
		uploadedBy: null,
	});
	const documentRepository = {
		compareAndSwapStatus: (
			transition: Parameters<
				DocumentRepository["compareAndSwapStatus"]
			>[typeof FIRST_PARAMETER_INDEX],
		) => {
			transitions.push(transition);
			return Promise.resolve(document);
		},
		findById: () => Promise.resolve(document),
		updateProcessingProgress: (
			update: Parameters<
				DocumentRepository["updateProcessingProgress"]
			>[typeof FIRST_PARAMETER_INDEX],
		) => {
			updates.push(update);
			return Promise.resolve(isCurrent);
		},
	} as unknown as DocumentRepository;
	const analyzer = new IntegrationAnalyzer({
		analyze: ({ candidates, itemText }) => {
			candidateCountByText.set(itemText, candidates.length);

			if (itemText.trim() === "") {
				return Promise.reject(
					new Error("Cannot analyze an empty knowledge item"),
				);
			}

			return Promise.resolve({
				explanation: "No related knowledge.",
				matchedItem: null,
				matches: [],
				parentIndex: null,
				parentPriorIndex: null,
				proposesParent: true,
				score: null,
				siblingOrder: 0,
				type: IntegrationChangeType.NEW,
			});
		},
		database: {
			transaction: <T>(callback: (transaction: Transaction) => Promise<T>) =>
				callback({} as Transaction),
		} as Database,
		documentRepository,
		embedChunked: (entries) =>
			Promise.resolve(entries.map(({ item }) => ({ item, vector: [] }))),
		extractionItemRepository: {
			findByDocumentId: () => Promise.resolve(items),
		} as unknown as ExtractionItemRepository,
		integrationChangeRepository: {
			replaceByDocumentId: ({
				changes,
			}: Parameters<
				IntegrationChangeRepository["replaceByDocumentId"]
			>[typeof FIRST_PARAMETER_INDEX]) => {
				persistedCounts.push(changes.length);
				persistedChanges.push(...changes);
				return Promise.resolve();
			},
		} as unknown as IntegrationChangeRepository,
		knowledgeNodeRepository: {
			findAllByProjectId: (projectId: number) => {
				projects.push(projectId);
				return Promise.resolve([]);
			},
		} as unknown as KnowledgeNodeRepository,
		logger: {
			debug: ignoreLog,
			error: ignoreLog,
			info: ignoreLog,
			warn: ignoreLog,
		},
		placeSections: ({ sections }) => {
			outlinedSections.push(sections.map(({ text }) => text));

			return Promise.resolve(
				sections.map((_section, index) => ({
					parentIndex: null,
					parentPriorIndex:
						index === LAST_SECTION_INDEX ? FIRST_SECTION_INDEX : null,
					proposesParent: true,
					siblingOrder: ZERO_COUNT,
				})),
			);
		},
	});
	return {
		analyzer,
		candidateCountByText,
		outlinedSections,
		persistedChanges,
		persistedCounts,
		projects,
		transitions,
		updates,
	};
};

const progress = (
	processedUnits: number,
	totalUnits: number,
	failedUnits = ZERO_COUNT,
): DocumentProcessingProgressDto => ({
	failedUnits,
	phase: DocumentProcessingPhase.INTEGRATING,
	processedUnits,
	totalUnits,
});

void describe("integration progress", () => {
	void it("counts approved items and stops at approval rather than publishing", async () => {
		const setup = createSetup([
			createItem(FIRST_ITEM_ID, "First"),
			createItem(SECOND_ITEM_ID, "Rejected", {
				status: ExtractionItemStatus.REJECTED,
			}),
			createItem(THIRD_ITEM_ID, "Last"),
		]);
		assert.equal(
			await setup.analyzer.process({
				attempt: ATTEMPT,
				documentId: DOCUMENT_ID,
			}),
			true,
		);
		assert.deepEqual(
			setup.updates.map((update) => update.progress),
			[
				progress(ZERO_COUNT, SECOND_ITEM_ID),
				progress(FIRST_ITEM_ID, SECOND_ITEM_ID),
				progress(SECOND_ITEM_ID, SECOND_ITEM_ID),
			],
		);
		assert.ok(
			setup.updates.every(
				(update) =>
					update.processingAttempt === ATTEMPT &&
					update.id === DOCUMENT_ID &&
					update.status === DocumentStatus.INTEGRATING,
			),
		);
		assert.equal(
			setup.transitions[FIRST_PARAMETER_INDEX]?.status,
			DocumentStatus.WAITING_FOR_APPROVAL,
		);
		assert.deepEqual(setup.persistedCounts, [SECOND_ITEM_ID]);
		assert.deepEqual(setup.projects, [PROJECT_ID]);
	});

	void it("records the failed item without publishing partial changes", async () => {
		const setup = createSetup([
			createItem(FIRST_ITEM_ID, "First"),
			createItem(SECOND_ITEM_ID, ""),
			createItem(THIRD_ITEM_ID, "Last"),
		]);
		await assert.rejects(
			setup.analyzer.process({ attempt: ATTEMPT, documentId: DOCUMENT_ID }),
			/empty knowledge item/u,
		);
		assert.ok(
			setup.updates.some(
				(update) => update.progress.failedUnits === SINGLE_COUNT,
			),
		);
		assert.deepEqual(setup.transitions, []);
		assert.deepEqual(setup.persistedCounts, []);
	});

	void it("does no analysis or persistence for a superseded attempt", async () => {
		const setup = createSetup([createItem(FIRST_ITEM_ID, "First")], false);
		assert.equal(
			await setup.analyzer.process({
				attempt: ATTEMPT,
				documentId: DOCUMENT_ID,
			}),
			false,
		);
		assert.deepEqual(setup.projects, []);
		assert.deepEqual(setup.transitions, []);
		assert.deepEqual(setup.persistedCounts, []);
	});

	void it("lays out the document once and compares each item with the earlier ones", async () => {
		const setup = createSetup([
			createItem(FIRST_ITEM_ID, "Section one start", {
				extractionSectionId: FIRST_SECTION_ID,
			}),
			createItem(SECOND_ITEM_ID, "Section two start", {
				extractionSectionId: SECOND_SECTION_ID,
			}),
			createItem(THIRD_ITEM_ID, "Section one follow-up", {
				extractionSectionId: FIRST_SECTION_ID,
			}),
		]);

		await setup.analyzer.process({ attempt: ATTEMPT, documentId: DOCUMENT_ID });

		assert.deepEqual(setup.outlinedSections, [
			["Section one start", "Section two start", "Section one follow-up"],
		]);
		assert.equal(
			setup.candidateCountByText.get("Section one start"),
			ZERO_COUNT,
		);
		assert.equal(
			setup.candidateCountByText.get("Section two start"),
			SINGLE_COUNT,
		);
		assert.equal(
			setup.candidateCountByText.get("Section one follow-up"),
			TWO_COUNT,
		);
		assert.deepEqual(
			setup.persistedChanges.map(
				(change) => change.toObject().placement.parentExtractionItemId,
			),
			[null, null, FIRST_ITEM_ID],
		);
	});
});
