import "~/test-setup.js";

import {
	DocumentProcessingPhase,
	DocumentSourceType,
	DocumentStatus,
	ExtractionItemStatus,
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
import { type DocumentRepository } from "../repositories/document.repository.js";
import { type ExtractionItemRepository } from "../repositories/extraction-item.repository.js";
import { type IntegrationChangeRepository } from "../repositories/integration-change.repository.js";
import { IntegrationAnalyzer } from "./integration-analyzer.js";

const DOCUMENT_ID = 7;
const PROJECT_ID = 3;
const ATTEMPT = 2;
const FIRST_ITEM_ID = 1;
const SECOND_ITEM_ID = 2;
const THIRD_ITEM_ID = 3;
const ZERO_COUNT = 0;
const FIRST_PARAMETER_INDEX = 0;

const createItem = (
	id: number,
	text: string,
	status: ValueOf<typeof ExtractionItemStatus> = ExtractionItemStatus.APPROVED,
): ExtractionItemEntity =>
	ExtractionItemEntity.initialize({
		confidence: 1,
		documentId: DOCUMENT_ID,
		extractionSectionId: null,
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
		database: {
			transaction: <T>(callback: (transaction: Transaction) => Promise<T>) =>
				callback({} as Transaction),
		} as Database,
		documentRepository,
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
				return Promise.resolve();
			},
		} as unknown as IntegrationChangeRepository,
		knowledgeNodeRepository: {
			findAllByProjectId: (projectId: number) => {
				projects.push(projectId);
				return Promise.resolve([]);
			},
		} as unknown as KnowledgeNodeRepository,
	});
	return { analyzer, persistedCounts, projects, transitions, updates };
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
			createItem(SECOND_ITEM_ID, "Rejected", ExtractionItemStatus.REJECTED),
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

	void it("records the failed item without counting untouched items or publishing partial changes", async () => {
		const setup = createSetup([
			createItem(FIRST_ITEM_ID, "First"),
			createItem(SECOND_ITEM_ID, ""),
			createItem(THIRD_ITEM_ID, "Untouched"),
		]);
		await assert.rejects(
			setup.analyzer.process({ attempt: ATTEMPT, documentId: DOCUMENT_ID }),
			/empty knowledge item/u,
		);
		assert.deepEqual(
			setup.updates.at(-FIRST_ITEM_ID)?.progress,
			progress(SECOND_ITEM_ID, THIRD_ITEM_ID, FIRST_ITEM_ID),
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
});
