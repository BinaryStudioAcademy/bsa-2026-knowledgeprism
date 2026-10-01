import {
	DocumentErrorMessage,
	DocumentProcessingPhase,
	DocumentSourceType,
	DocumentStatus,
	ExtractionItemStatus,
	KnowledgeNodeType,
} from "@knowledgeprism/constants";
import {
	type DocumentProcessingProgressDto,
	type ExtractionContentBlock,
	ExtractionHeadingLevel,
	type ValueOf,
} from "@knowledgeprism/types";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { type Transaction } from "objection";

import { type Database } from "~/infrastructure/database/database.js";
import { HTTPCode, HTTPError } from "~/infrastructure/http/http.js";
import { DocumentEntity } from "~/modules/documents/models/document.entity.js";
import { ExtractionItemEntity } from "~/modules/documents/models/extraction-item.entity.js";
import { ExtractionSectionEntity } from "~/modules/documents/models/extraction-section.entity.js";
import { type DocumentRepository } from "~/modules/documents/repositories/document.repository.js";
import { type ExtractionItemRepository } from "~/modules/documents/repositories/extraction-item.repository.js";
import { type ExtractionSectionRepository } from "~/modules/documents/repositories/extraction-section.repository.js";
import { type IntegrationChangeRepository } from "~/modules/documents/repositories/integration-change.repository.js";
import { type ProjectService } from "~/modules/projects/services/project.service.js";

import { type DocumentJobScheduler } from "./document-job-scheduler.js";
import { DocumentReviewService } from "./document-review.service.js";
import { type IntegrationApplier } from "./integration-applier.js";

const DOCUMENT_ID = 1;
const PROJECT_ID = 1;
const ITEM_ID = 10;
const MANUAL_ITEM_ID = 11;
const SECTION_ID = 20;
const USER_ID = 1;
const ORGANISATION_ID = 1;
const ATTEMPT_NUMBER = 1;
const DOCUMENT_SIZE = 100;
const CONFIDENCE_SCORE = 0.95;
const PAGE_NUMBER = 1;
const FIRST_POSITION = 0;
const MIN_EXPECTED_CALLS = 2;
const NO_POSITION_OFFSET = 0;
const SECOND_POSITION = 1;
const LARGE_PAGE_COUNT = 189;

type FindCallOptions = {
	forUpdate?: boolean | undefined;
	transaction?: Transaction | undefined;
};

type TransactionContext = {
	id: number;
	releaseLock?: () => void;
};

const PROCESSING_ATTEMPT = 1;

const createTestSetup = (
	failedPageNumbers: number[] = [],
	processingProgress: DocumentProcessingProgressDto | null = null,
	isAuthorized = true,
): {
	getFindCalls: () => FindCallOptions[];
	getItems: () => ExtractionItemEntity[];
	service: DocumentReviewService;
} => {
	let documentStatus: ValueOf<typeof DocumentStatus> =
		DocumentStatus.WAITING_FOR_VALIDATION;

	let items: ExtractionItemEntity[] = [
		ExtractionItemEntity.initialize({
			confidence: CONFIDENCE_SCORE,
			documentId: DOCUMENT_ID,
			extractionSectionId: null,
			heading: null,
			id: ITEM_ID,
			knowledgeNodeId: null,
			position: FIRST_POSITION,
			rationale: "Original rationale",
			sourceExcerpt: "Original excerpt",
			sourcePageNumber: PAGE_NUMBER,
			status: ExtractionItemStatus.PENDING,
			text: "Original text",
			title: "Original title",
		}),
	];

	let nextTransactionId = 1;
	let rowLockQueue: Promise<null> = Promise.resolve(null);
	const findCalls: FindCallOptions[] = [];

	const database = {
		transaction: async <T>(
			handler: (transaction: Transaction) => Promise<T>,
		): Promise<T> => {
			const transaction = {
				id: nextTransactionId++,
			} as unknown as Transaction;

			try {
				return await handler(transaction);
			} finally {
				const context = transaction as unknown as TransactionContext;
				if (context.releaseLock) {
					context.releaseLock();
				}
			}
		},
	} as unknown as Database;

	const documentRepository = {
		compareAndSwapStatus: ({
			status,
		}: {
			status: ValueOf<typeof DocumentStatus>;
		}): Promise<DocumentEntity | null> => {
			if (documentStatus !== DocumentStatus.WAITING_FOR_VALIDATION) {
				return Promise.resolve(null);
			}
			documentStatus = status;

			return Promise.resolve(
				DocumentEntity.initialize({
					content: "content",
					contentHash: "hash",
					createdAt: new Date(),
					errorMessage: null,
					failedPageNumbers,
					id: DOCUMENT_ID,
					mimeType: "application/pdf",
					name: "sample.pdf",
					processingAttempt: PROCESSING_ATTEMPT,
					processingProgress,
					projectId: PROJECT_ID,
					s3Key: null,
					sizeInBytes: DOCUMENT_SIZE,
					sourceType: DocumentSourceType.UPLOAD,
					status,
					updatedAt: new Date(),
					uploadedBy: USER_ID,
				}),
			);
		},
		findByIdAndProjectId: async (
			_reference: { id: number; projectId: number },
			options?: { forUpdate?: boolean; transaction?: Transaction },
		): Promise<DocumentEntity | null> => {
			findCalls.push({
				forUpdate: options?.forUpdate,
				transaction: options?.transaction,
			});

			if (options?.forUpdate && options.transaction) {
				const previousLock = rowLockQueue;
				const { promise, resolve } = Promise.withResolvers<null>();
				rowLockQueue = promise;
				await previousLock;
				(options.transaction as unknown as TransactionContext).releaseLock =
					(): void => {
						resolve(null);
					};
			}

			await Promise.resolve();

			return DocumentEntity.initialize({
				content: "content",
				contentHash: "hash",
				createdAt: new Date(),
				errorMessage: null,
				failedPageNumbers,
				id: DOCUMENT_ID,
				mimeType: "application/pdf",
				name: "sample.pdf",
				processingAttempt: PROCESSING_ATTEMPT,
				processingProgress,
				projectId: PROJECT_ID,
				s3Key: null,
				sizeInBytes: DOCUMENT_SIZE,
				sourceType: DocumentSourceType.UPLOAD,
				status: documentStatus,
				updatedAt: new Date(),
				uploadedBy: USER_ID,
			});
		},
		startProcessing: ({
			status,
		}: {
			status: ValueOf<typeof DocumentStatus>;
		}): Promise<null | { attempt: number; document: DocumentEntity }> => {
			if (documentStatus !== DocumentStatus.WAITING_FOR_VALIDATION) {
				return Promise.resolve(null);
			}
			documentStatus = status;

			return Promise.resolve({
				attempt: ATTEMPT_NUMBER,
				document: DocumentEntity.initialize({
					content: "content",
					contentHash: "hash",
					createdAt: new Date(),
					errorMessage: null,
					failedPageNumbers,
					id: DOCUMENT_ID,
					mimeType: "application/pdf",
					name: "sample.pdf",
					processingAttempt: PROCESSING_ATTEMPT,
					processingProgress,
					projectId: PROJECT_ID,
					s3Key: null,
					sizeInBytes: DOCUMENT_SIZE,
					sourceType: DocumentSourceType.UPLOAD,
					status,
					updatedAt: new Date(),
					uploadedBy: USER_ID,
				}),
			});
		},
	} as unknown as DocumentRepository;

	let nextItemId = MANUAL_ITEM_ID;

	const extractionItemRepository = {
		findByDocumentId: async (): Promise<ExtractionItemEntity[]> => {
			await Promise.resolve();
			return items;
		},
		findById: (id: number): Promise<ExtractionItemEntity | null> => {
			return Promise.resolve(
				items.find((item) => item.toObject().id === id) ?? null,
			);
		},
		insertManyPending: async ({
			documentId,
			items: newItems,
		}: {
			documentId: number;
			items: {
				confidence: number;
				extractionSectionId?: null | number;
				heading?: null | string;
				position?: number;
				rationale: string;
				sourceExcerpt: string;
				sourcePageNumber: number;
				text: string;
				title: string;
			}[];
		}): Promise<ExtractionItemEntity[]> => {
			await Promise.resolve();

			const created = newItems.map((item) =>
				ExtractionItemEntity.initialize({
					...item,
					documentId,
					extractionSectionId: item.extractionSectionId ?? null,
					heading: item.heading ?? null,
					id: nextItemId++,
					knowledgeNodeId: null,
					position: item.position ?? FIRST_POSITION,
					status: ExtractionItemStatus.PENDING,
				}),
			);

			items = [...items, ...created];

			return created;
		},
		markApproved: (ids: number[]): Promise<void> => {
			items = items.map((item) => {
				const current = item.toObject();
				if (ids.includes(current.id)) {
					return ExtractionItemEntity.initialize({
						...current,
						status: ExtractionItemStatus.APPROVED,
					});
				}

				return item;
			});

			return Promise.resolve();
		},
		markRejected: (ids: number[]): Promise<void> => {
			items = items.map((item) => {
				const current = item.toObject();
				if (ids.includes(current.id)) {
					return ExtractionItemEntity.initialize({
						...current,
						status: ExtractionItemStatus.REJECTED,
					});
				}

				return item;
			});

			return Promise.resolve();
		},
		updatePendingContent: async ({
			id,
			payload,
		}: {
			documentId: number;
			id: number;
			payload: { text: string; title: string };
		}): Promise<ExtractionItemEntity | null> => {
			await Promise.resolve();
			const currentItem = items.find((item) => item.toObject().id === id);
			if (!currentItem) {
				return null;
			}
			const current = currentItem.toObject();
			if (current.status !== ExtractionItemStatus.PENDING) {
				return null;
			}
			const updated = ExtractionItemEntity.initialize({
				...current,
				text: payload.text,
				title: payload.title,
			});
			items = items.map((item) => (item.toObject().id === id ? updated : item));

			return updated;
		},
		updatePendingReviewPlacement: async ({
			blocks,
			extractionSectionId,
			id,
			position,
			text,
			title,
		}: {
			blocks?: ExtractionContentBlock[];
			documentId: number;
			extractionSectionId: number;
			id: number;
			position: number;
			text: string;
			title: string;
		}): Promise<ExtractionItemEntity | null> => {
			await Promise.resolve();
			const currentItem = items.find((item) => item.toObject().id === id);

			if (!currentItem) {
				return null;
			}

			const current = currentItem.toObject();

			if (current.status !== ExtractionItemStatus.PENDING) {
				return null;
			}

			const updated = ExtractionItemEntity.initialize({
				...current,
				...(blocks && { blocks }),
				extractionSectionId,
				position,
				text,
				title,
			});
			items = items.map((item) => (item.toObject().id === id ? updated : item));

			return updated;
		},
	} as unknown as ExtractionItemRepository;

	const extractionSectionRepository = {
		findByDocumentId: (): Promise<[]> => Promise.resolve([]),
		replaceByDocumentId: ({
			documentId,
			sections,
		}: {
			documentId: number;
			sections: { position: number; title: string }[];
		}): Promise<{
			positionOffset: number;
			sections: ExtractionSectionEntity[];
		}> => {
			return Promise.resolve({
				positionOffset: NO_POSITION_OFFSET,
				sections: sections.map((section, index) =>
					ExtractionSectionEntity.initialize({
						documentId,
						id: SECTION_ID + index,
						position: section.position,
						title: section.title,
						type: KnowledgeNodeType.SECTION,
					}),
				),
			});
		},
	} as unknown as ExtractionSectionRepository;

	const projectService = {
		assertCanWriteKnowledge: () => Promise.resolve(),
		assertProjectAccess: () =>
			isAuthorized
				? Promise.resolve()
				: Promise.reject(
						new HTTPError({ message: "Forbidden", status: HTTPCode.FORBIDDEN }),
					),
	} as unknown as ProjectService;

	const documentJobScheduler = {
		scheduleIntegration: () => {},
	} as unknown as DocumentJobScheduler;

	const integrationApplier = {
		apply: () => Promise.resolve(),
	} as unknown as IntegrationApplier;

	const integrationChangeRepository = {
		findByDocumentId: (): Promise<[]> => Promise.resolve([]),
	} as unknown as IntegrationChangeRepository;

	const service = new DocumentReviewService({
		database,
		documentJobScheduler,
		documentRepository,
		extractionItemRepository,
		extractionSectionRepository,
		integrationApplier,
		integrationChangeRepository,
		projectService,
	});

	return {
		getFindCalls: (): FindCallOptions[] => findCalls,
		getItems: (): ExtractionItemEntity[] => items,
		service,
	};
};

void describe("DocumentReviewService Concurrency", () => {
	void it("returns persisted progress through the authorized document status response", async () => {
		const progress: DocumentProcessingProgressDto = {
			failedUnits: 1,
			phase: DocumentProcessingPhase.EXTRACTING,
			processedUnits: 2,
			totalUnits: 3,
		};
		const { service } = createTestSetup([], progress);
		const result = await service.findStatus({
			context: { organisationId: ORGANISATION_ID, userId: USER_ID },
			documentId: DOCUMENT_ID,
			projectId: PROJECT_ID,
		});
		assert.deepEqual(result.processingProgress, progress);
		assert.equal(result.processingAttempt, PROCESSING_ATTEMPT);
	});
	void it("does not load progress before project authorization succeeds", async () => {
		const { getFindCalls, service } = createTestSetup([], null, false);
		await assert.rejects(
			service.findStatus({
				context: { organisationId: ORGANISATION_ID, userId: USER_ID },
				documentId: DOCUMENT_ID,
				projectId: PROJECT_ID,
			}),
			(error: unknown) =>
				error instanceof HTTPError && error.status === HTTPCode.FORBIDDEN,
		);
		assert.deepEqual(getFindCalls(), []);
	});

	void it("returns persisted incomplete pages alongside extraction items", async () => {
		const { service } = createTestSetup([PAGE_NUMBER]);
		const result = await service.findItems({
			context: { organisationId: ORGANISATION_ID, userId: USER_ID },
			documentId: DOCUMENT_ID,
			projectId: PROJECT_ID,
		});
		assert.deepEqual(result.failedPageNumbers, [PAGE_NUMBER]);
		assert.ok(result.items.some((item) => item.id === ITEM_ID));
	});

	void it("uses edited content when edit finishes before review", async () => {
		const { getFindCalls, getItems, service } = createTestSetup();

		const editPromise = service.updateItem({
			context: { organisationId: ORGANISATION_ID, userId: USER_ID },
			documentId: DOCUMENT_ID,
			id: ITEM_ID,
			payload: {
				text: "Updated text",
				title: "Updated title",
			},
			projectId: PROJECT_ID,
		});

		const reviewPromise = service.review({
			context: { organisationId: ORGANISATION_ID, userId: USER_ID },
			documentId: DOCUMENT_ID,
			payload: {
				approvedIds: [ITEM_ID],
				rejectedIds: [],
			},
			projectId: PROJECT_ID,
		});

		const [editResult, reviewResult] = await Promise.all([
			editPromise,
			reviewPromise,
		]);

		assert.strictEqual(editResult.title, "Updated title");
		assert.strictEqual(editResult.text, "Updated text");
		assert.strictEqual(
			reviewResult.status,
			DocumentStatus.WAITING_FOR_VALIDATION,
		);

		const approvedItem = getItems().find(
			(item) => item.toObject().id === ITEM_ID,
		);
		assert.ok(approvedItem);
		assert.strictEqual(
			approvedItem.toObject().status,
			ExtractionItemStatus.APPROVED,
		);
		assert.strictEqual(approvedItem.toObject().title, "Updated title");
		assert.strictEqual(approvedItem.toObject().text, "Updated text");

		const calls = getFindCalls();
		assert.ok(calls.length >= MIN_EXPECTED_CALLS);
		assert.ok(
			calls.every(
				(call) => call.forUpdate === true && Boolean(call.transaction),
			),
		);
	});

	void it("rejects edit with 409 conflict when approval starts first", async () => {
		const { getFindCalls, service } = createTestSetup();

		const reviewPromise = service.review({
			context: { organisationId: ORGANISATION_ID, userId: USER_ID },
			documentId: DOCUMENT_ID,
			payload: {
				approvedIds: [ITEM_ID],
				rejectedIds: [],
			},
			projectId: PROJECT_ID,
		});

		const editPromise = service.updateItem({
			context: { organisationId: ORGANISATION_ID, userId: USER_ID },
			documentId: DOCUMENT_ID,
			id: ITEM_ID,
			payload: {
				text: "Concurrent edit text",
				title: "Concurrent edit title",
			},
			projectId: PROJECT_ID,
		});

		const reviewResult = await reviewPromise;
		assert.strictEqual(
			reviewResult.status,
			DocumentStatus.WAITING_FOR_VALIDATION,
		);

		await assert.rejects(
			async () => {
				await editPromise;
			},
			(error: unknown) => {
				assert.ok(error instanceof HTTPError);
				assert.strictEqual(error.status, HTTPCode.CONFLICT);
				assert.strictEqual(
					error.message,
					DocumentErrorMessage.EXTRACTION_ITEM_NOT_PENDING,
				);

				return true;
			},
		);

		const calls = getFindCalls();
		assert.ok(calls.length >= MIN_EXPECTED_CALLS);
		assert.ok(
			calls.every(
				(call) => call.forUpdate === true && Boolean(call.transaction),
			),
		);
	});

	void it("persists structured review edits and manual items", async () => {
		const { getItems, service } = createTestSetup();

		const reviewResult = await service.review({
			context: { organisationId: ORGANISATION_ID, userId: USER_ID },
			documentId: DOCUMENT_ID,
			payload: {
				approvedIds: [],
				rejectedIds: [],
				sections: [
					{
						items: [
							{
								blocks: [
									{
										content: [{ text: "Core Capabilities", type: "text" }],
										props: { level: ExtractionHeadingLevel.SECTION },
										type: "heading",
									},
									{
										content: [
											{ styles: { bold: true }, text: "Stores", type: "text" },
										],
										type: "bulletListItem",
									},
								],
								id: ITEM_ID,
								text: "Structured text",
								title: "Structured title",
							},
							{
								text: "Manual text",
								title: "Manual title",
							},
						],
						title: "Custom page",
					},
				],
			},
			projectId: PROJECT_ID,
		});

		assert.strictEqual(
			reviewResult.status,
			DocumentStatus.WAITING_FOR_VALIDATION,
		);

		const reviewedItems = getItems().map((item) => item.toObject());
		const updatedOriginal = reviewedItems.find((item) => item.id === ITEM_ID);
		const createdManual = reviewedItems.find(
			(item) => item.id === MANUAL_ITEM_ID,
		);

		assert.ok(updatedOriginal);
		assert.strictEqual(updatedOriginal.status, ExtractionItemStatus.APPROVED);
		assert.strictEqual(updatedOriginal.extractionSectionId, SECTION_ID);
		assert.strictEqual(updatedOriginal.position, FIRST_POSITION);
		assert.strictEqual(updatedOriginal.title, "Structured title");
		const savedBlocks = updatedOriginal.blocks ?? [];
		const headingBlock = savedBlocks[FIRST_POSITION];
		const listBlock = savedBlocks[SECOND_POSITION];

		assert.strictEqual(updatedOriginal.text, "Structured text");
		assert.ok(headingBlock);
		assert.ok(listBlock);
		assert.strictEqual(headingBlock.type, "heading");
		assert.strictEqual(listBlock.type, "bulletListItem");

		assert.ok(createdManual);
		assert.strictEqual(createdManual.status, ExtractionItemStatus.APPROVED);
		assert.strictEqual(createdManual.extractionSectionId, SECTION_ID);
		assert.strictEqual(createdManual.position, SECOND_POSITION);
		assert.strictEqual(createdManual.title, "Manual title");
		assert.strictEqual(createdManual.text, "Manual text");
	});

	void it("handles large document reviews with numerous pages and items", async () => {
		const { getItems, service } = createTestSetup();
		const largeSections = Array.from(
			{ length: LARGE_PAGE_COUNT },
			(_, index) => ({
				items: [
					...(index === FIRST_POSITION
						? [
								{
									id: ITEM_ID,
									text: "Existing first page content",
									title: "Existing first page title",
								},
							]
						: [
								{
									text: `Content for page ${String(index + PAGE_NUMBER)}`,
									title: `Title for page ${String(index + PAGE_NUMBER)}`,
								},
							]),
				],
				title: `Page ${String(index + PAGE_NUMBER)}`,
			}),
		);

		const reviewResult = await service.review({
			context: { organisationId: ORGANISATION_ID, userId: USER_ID },
			documentId: DOCUMENT_ID,
			payload: {
				approvedIds: [],
				rejectedIds: [],
				sections: largeSections,
			},
			projectId: PROJECT_ID,
		});

		assert.strictEqual(
			reviewResult.status,
			DocumentStatus.WAITING_FOR_VALIDATION,
		);

		const reviewedItems = getItems();
		assert.strictEqual(reviewedItems.length, LARGE_PAGE_COUNT);
		assert.ok(
			reviewedItems.every(
				(item) => item.toObject().status === ExtractionItemStatus.APPROVED,
			),
		);
	});
});
