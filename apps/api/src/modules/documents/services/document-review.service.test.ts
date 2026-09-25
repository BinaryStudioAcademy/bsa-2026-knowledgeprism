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

const DOCUMENT_ID = 1;
const PROJECT_ID = 1;
const ITEM_ID = 10;
const USER_ID = 1;
const ORGANISATION_ID = 1;
const ATTEMPT_NUMBER = 1;
const DOCUMENT_SIZE = 100;
const CONFIDENCE_SCORE = 0.95;
const PAGE_NUMBER = 1;

const createTestSetup = (): {
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

	let lockChain: Promise<null> = Promise.resolve(null);

	const database = {
		transaction: async <T>(
			handler: (transaction: Transaction) => Promise<T>,
		): Promise<T> => {
			const previousLock = lockChain;
			const { promise, resolve } = Promise.withResolvers<null>();
			lockChain = promise;
			await previousLock;
			try {
				return await handler({} as Transaction);
			} finally {
				resolve(null);
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
		findByIdAndProjectId: (): Promise<DocumentEntity | null> => {
			return Promise.resolve(
				DocumentEntity.initialize({
					content: "content",
					contentHash: "hash",
					createdAt: new Date(),
					errorMessage: null,
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
				}),
			);
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
		findByDocumentId: (): Promise<ExtractionItemEntity[]> =>
			Promise.resolve(items),
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
		updatePendingContent: ({
			id,
			payload,
		}: {
			documentId: number;
			id: number;
			payload: { text: string; title: string };
		}): Promise<ExtractionItemEntity | null> => {
			const currentItem = items.find((item) => item.toObject().id === id);
			if (!currentItem) {
				return Promise.resolve(null);
			}
			const current = currentItem.toObject();
			if (current.status !== ExtractionItemStatus.PENDING) {
				return Promise.resolve(null);
			}
			const updated = ExtractionItemEntity.initialize({
				...current,
				text: payload.text,
				title: payload.title,
			});
			items = items.map((item) => (item.toObject().id === id ? updated : item));

			return Promise.resolve(updated);
		},
	} as unknown as ExtractionItemRepository;

	const projectService = {
		assertCanWriteKnowledge: () => Promise.resolve(),
		assertProjectAccess: () => Promise.resolve(),
	} as unknown as ProjectService;

	const documentJobScheduler = {
		scheduleIntegration: () => {},
	} as unknown as DocumentJobScheduler;

	const integrationChangeRepository = {
		findByDocumentId: (): Promise<[]> => Promise.resolve([]),
	} as unknown as IntegrationChangeRepository;

	const service = new DocumentReviewService({
		database,
		documentJobScheduler,
		documentRepository,
		extractionItemRepository,
		integrationChangeRepository,
		projectService,
	});

	return {
		getItems: (): ExtractionItemEntity[] => items,
		service,
	};
};

void describe("DocumentReviewService Concurrency", () => {
	void it("uses edited content when edit finishes before review", async () => {
		const { getItems, service } = createTestSetup();

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
	});

	void it("rejects edit with 409 conflict when approval starts first", async () => {
		const { service } = createTestSetup();

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
	});
});
