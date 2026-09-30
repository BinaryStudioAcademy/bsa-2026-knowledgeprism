import {
	DocumentErrorMessage,
	DocumentSourceType,
	DocumentStatus,
	ExtractionItemStatus,
} from "@knowledgeprism/constants";
import { type ValueOf } from "@knowledgeprism/types";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { type Transaction } from "objection";

import { type Database } from "~/infrastructure/database/database.js";
import { HTTPCode, HTTPError } from "~/infrastructure/http/http.js";
import { DocumentEntity } from "~/modules/documents/models/document.entity.js";
import { ExtractionItemEntity } from "~/modules/documents/models/extraction-item.entity.js";
import { type DocumentRepository } from "~/modules/documents/repositories/document.repository.js";
import { type ExtractionItemRepository } from "~/modules/documents/repositories/extraction-item.repository.js";
import { type IntegrationChangeRepository } from "~/modules/documents/repositories/integration-change.repository.js";
import { type ProjectService } from "~/modules/projects/services/project.service.js";

import { type DocumentJobScheduler } from "./document-job-scheduler.js";
import { DocumentReviewService } from "./document-review.service.js";
import { type IntegrationApplier } from "./integration-applier.js";

const DOCUMENT_ID = 1;
const PROJECT_ID = 1;
const ITEM_ID = 10;
const USER_ID = 1;
const ORGANISATION_ID = 1;
const ATTEMPT_NUMBER = 1;
const DOCUMENT_SIZE = 100;
const CONFIDENCE_SCORE = 0.95;
const PAGE_NUMBER = 1;
const MIN_EXPECTED_CALLS = 2;

type FindCallOptions = {
	forUpdate?: boolean | undefined;
	transaction?: Transaction | undefined;
};

type TransactionContext = {
	id: number;
	releaseLock?: () => void;
};

const createTestSetup = (
	failedPageNumbers: number[] = [],
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
			id: ITEM_ID,
			knowledgeNodeId: null,
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
	} as unknown as ExtractionItemRepository;

	const projectService = {
		assertCanWriteKnowledge: () => Promise.resolve(),
		assertProjectAccess: () => Promise.resolve(),
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
		assert.strictEqual(reviewResult.status, DocumentStatus.INTEGRATING);

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
		assert.strictEqual(reviewResult.status, DocumentStatus.INTEGRATING);

		await assert.rejects(
			async () => {
				await editPromise;
			},
			(error: unknown) => {
				assert.ok(error instanceof HTTPError);
				assert.strictEqual(error.status, HTTPCode.CONFLICT);
				assert.strictEqual(
					error.message,
					DocumentErrorMessage.REVIEW_NOT_ALLOWED,
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
});
