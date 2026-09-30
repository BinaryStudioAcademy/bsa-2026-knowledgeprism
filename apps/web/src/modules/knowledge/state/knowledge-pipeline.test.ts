import {
	DocumentErrorMessage,
	DocumentSourceType,
	DocumentStatus,
	KnowledgeNodeType,
} from "@knowledgeprism/constants";
import {
	type DocumentStatusResponseDto,
	type ExtractionItemsResponseDto,
	type KnowledgeEntryResponseDto,
	type ManualTextResponseDto,
} from "@knowledgeprism/types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { notificationService } from "~/lib/notifications/notification.service.js";
import { store } from "~/lib/store/store.js";
import { type AppNotification } from "~/lib/types/types.js";

import { documentsApi, knowledgeApi } from "../knowledge.js";
import {
	addTrackedDocumentId,
	readTrackedDocumentIds,
} from "../libs/helpers/helpers.js";
import {
	applyIntegrationChanges,
	confirmDocumentUpload,
	fetchExtractionItems,
	fetchKnowledgeEntry,
	fetchKnowledgeTree,
	fetchPendingReviewDocuments,
	initializeProjectKnowledgePipeline,
	pollDocumentStatus,
	resumeNextPendingReview,
	retryDocumentProcessing,
	submitExtractionReview,
	submitManualText,
	switchActiveDocument,
	untrackDocument,
	updateExtractionItem,
	updateKnowledgeEntry,
} from "./actions.js";
import { actions } from "./knowledge.slice.js";

const PROJECT_ID = "project-a";
const SECOND_PROJECT_ID = "project-b";
const DOCUMENT_A_ID = 11;
const DOCUMENT_B_ID = 12;
const DOCUMENT_C_ID = 13;
const EXTRACTION_ITEM_ID = 1;
const KNOWLEDGE_ENTRY_A_ID = 1;
const KNOWLEDGE_ENTRY_B_ID = 2;
const POLL_RETRY_DELAY_MS = 30_000;
const SINGLE_CALL_COUNT = 1;
const TWO_CALL_COUNT = 2;
const FAILED_PAGE_NUMBER = 16;

const createStatusResponse = (
	documentId: number,
	status: DocumentStatusResponseDto["status"],
): DocumentStatusResponseDto => ({
	createdAt: "2026-09-28T00:00:00.000Z",
	errorMessage: null,
	id: documentId,
	name: `Document ${String(documentId)}`,
	projectId: 1,
	sourceType: DocumentSourceType.UPLOAD,
	status,
	updatedAt: "2026-09-28T00:00:00.000Z",
});

const createRequest = (documentId: number) => ({
	documentId,
	pipelineSessionId: store.instance.getState().knowledge.pipelineSessionId,
	projectId: PROJECT_ID,
});

const createKnowledgeEntry = (
	id: number,
	title: string,
): KnowledgeEntryResponseDto => ({
	contentJson: [],
	createdAt: "2026-09-28T00:00:00.000Z",
	id,
	parentId: null,
	position: 0,
	projectId: 1,
	title,
	type: KnowledgeNodeType.ENTRY,
	updatedAt: "2026-09-28T00:00:00.000Z",
});

const trackDocumentWithStatus = (
	documentId: number,
	status: DocumentStatusResponseDto["status"],
): void => {
	store.instance.dispatch(
		actions.trackDocument({
			documentId,
			label: `Document ${String(documentId)}`,
			projectId: PROJECT_ID,
		}),
	);
	store.instance.dispatch(
		actions.syncTrackedDocumentStatus({
			...createRequest(documentId),
			status,
		}),
	);
};

const createDeferred = <Value>(): PromiseWithResolvers<Value> =>
	Promise.withResolvers<Value>();

describe("knowledge pipeline lifecycle", () => {
	let unsubscribeNotifications: () => void;
	let notificationListener: ReturnType<
		typeof vi.fn<(notification: AppNotification) => void>
	>;

	beforeEach(() => {
		vi.useFakeTimers();
		sessionStorage.clear();
		store.instance.dispatch(actions.resetState(PROJECT_ID));
		notificationListener = vi.fn<(notification: AppNotification) => void>();
		unsubscribeNotifications =
			notificationService.subscribe(notificationListener);
		notificationListener.mockClear();
	});

	afterEach(() => {
		const uploadSession = store.instance.getState().knowledge.uploadSession;

		if (uploadSession) {
			store.instance.dispatch(
				actions.releaseUploadSession(uploadSession.projectId),
			);
		}

		store.instance.dispatch(actions.resetState(null));
		unsubscribeNotifications();
		vi.clearAllTimers();
		vi.useRealTimers();
	});

	it("clears a scheduled retry when the document is untracked", async () => {
		trackDocumentWithStatus(DOCUMENT_A_ID, DocumentStatus.PROCESSING);
		const getStatus = vi
			.spyOn(documentsApi, "getDocumentStatus")
			.mockRejectedValue(new Error("offline"));

		await store.instance.dispatch(
			pollDocumentStatus(createRequest(DOCUMENT_A_ID)),
		);
		expect(getStatus).toHaveBeenCalledTimes(SINGLE_CALL_COUNT);

		void store.instance.dispatch(
			untrackDocument({
				documentId: DOCUMENT_A_ID,
				projectId: PROJECT_ID,
			}),
		);
		await vi.advanceTimersByTimeAsync(POLL_RETRY_DELAY_MS);

		expect(getStatus).toHaveBeenCalledTimes(SINGLE_CALL_COUNT);
		expect(store.instance.getState().knowledge.trackedDocuments).toEqual([]);
	});

	it("does not resurrect an untracked document when an in-flight poll resolves", async () => {
		trackDocumentWithStatus(DOCUMENT_A_ID, DocumentStatus.PROCESSING);
		const deferred = createDeferred<DocumentStatusResponseDto>();
		vi.spyOn(documentsApi, "getDocumentStatus").mockReturnValue(
			deferred.promise,
		);

		const polling = store.instance.dispatch(
			pollDocumentStatus(createRequest(DOCUMENT_A_ID)),
		);
		void store.instance.dispatch(
			untrackDocument({
				documentId: DOCUMENT_A_ID,
				projectId: PROJECT_ID,
			}),
		);
		deferred.resolve(
			createStatusResponse(
				DOCUMENT_A_ID,
				DocumentStatus.WAITING_FOR_VALIDATION,
			),
		);
		await polling;

		expect(store.instance.getState().knowledge.trackedDocuments).toEqual([]);
	});

	it("clears loading flags when request ownership is invalidated", () => {
		const startRequests = (): void => {
			store.instance.dispatch(
				fetchKnowledgeTree.pending("tree", { projectId: PROJECT_ID }),
			);
			store.instance.dispatch(
				fetchKnowledgeEntry.pending("entry", {
					entryId: KNOWLEDGE_ENTRY_A_ID,
					projectId: PROJECT_ID,
				}),
			);
		};
		const expectRequestsReleased = (): void => {
			const state = store.instance.getState().knowledge;

			expect(state.isEntryLoading).toBe(false);
			expect(state.isTreeLoading).toBe(false);
			expect(state.entryRequestId).toBeNull();
			expect(state.treeRequestId).toBeNull();
		};

		startRequests();
		store.instance.dispatch(actions.releasePipeline());
		expectRequestsReleased();

		startRequests();
		store.instance.dispatch(actions.resetState(SECOND_PROJECT_ID));
		expectRequestsReleased();
	});

	it("keeps an active document error while a background document polls", () => {
		trackDocumentWithStatus(
			DOCUMENT_A_ID,
			DocumentStatus.WAITING_FOR_VALIDATION,
		);
		trackDocumentWithStatus(DOCUMENT_B_ID, DocumentStatus.PROCESSING);
		const requestA = createRequest(DOCUMENT_A_ID);
		const requestB = createRequest(DOCUMENT_B_ID);

		store.instance.dispatch(pollDocumentStatus.pending("poll-a", requestA));
		store.instance.dispatch(
			pollDocumentStatus.rejected(new Error("A failed"), "poll-a", requestA),
		);
		store.instance.dispatch(pollDocumentStatus.pending("poll-b", requestB));
		store.instance.dispatch(
			pollDocumentStatus.fulfilled(
				createStatusResponse(DOCUMENT_B_ID, DocumentStatus.PROCESSING),
				"poll-b",
				requestB,
			),
		);

		expect(store.instance.getState().knowledge.pipelineErrors).toMatchObject({
			[DOCUMENT_A_ID]: "A failed",
		});
	});

	it("keeps an empty extraction failure message from the status poll", () => {
		trackDocumentWithStatus(DOCUMENT_A_ID, DocumentStatus.PROCESSING);
		const request = createRequest(DOCUMENT_A_ID);

		store.instance.dispatch(pollDocumentStatus.pending("poll-a", request));
		store.instance.dispatch(
			pollDocumentStatus.fulfilled(
				{
					...createStatusResponse(DOCUMENT_A_ID, DocumentStatus.FAILED),
					errorMessage: DocumentErrorMessage.NO_KNOWLEDGE_EXTRACTED,
				},
				"poll-a",
				request,
			),
		);

		const state = store.instance.getState().knowledge;
		expect(state.activeDocumentStatus).toBe(DocumentStatus.FAILED);
		expect(state.pipelineErrors[DOCUMENT_A_ID]).toBe(
			DocumentErrorMessage.NO_KNOWLEDGE_EXTRACTED,
		);
	});

	it("keeps Knowledge Entry failures separate from pipeline health", () => {
		trackDocumentWithStatus(DOCUMENT_A_ID, DocumentStatus.PROCESSING);
		store.instance.dispatch(
			fetchKnowledgeEntry.pending("entry", {
				entryId: KNOWLEDGE_ENTRY_A_ID,
				projectId: PROJECT_ID,
			}),
		);
		store.instance.dispatch(
			fetchKnowledgeEntry.rejected(new Error("entry failed"), "entry", {
				entryId: KNOWLEDGE_ENTRY_A_ID,
				projectId: PROJECT_ID,
			}),
		);

		const state = store.instance.getState().knowledge;
		expect(state.knowledgeErrorMessage).toBe("entry failed");
		expect(state.pipelineErrors[DOCUMENT_A_ID]).toBeUndefined();
		expect(state.activeDocumentStatus).toBe(DocumentStatus.PROCESSING);
	});

	it("keeps the latest Knowledge Entry when an older request settles last", async () => {
		const firstEntry = createDeferred<KnowledgeEntryResponseDto>();
		const secondEntry = createDeferred<KnowledgeEntryResponseDto>();
		vi.spyOn(knowledgeApi, "getKnowledgeEntry").mockImplementation(
			({ entryId }) =>
				entryId === KNOWLEDGE_ENTRY_A_ID
					? firstEntry.promise
					: secondEntry.promise,
		);

		const firstRequest = store.instance.dispatch(
			fetchKnowledgeEntry({
				entryId: KNOWLEDGE_ENTRY_A_ID,
				projectId: PROJECT_ID,
			}),
		);
		const secondRequest = store.instance.dispatch(
			fetchKnowledgeEntry({
				entryId: KNOWLEDGE_ENTRY_B_ID,
				projectId: PROJECT_ID,
			}),
		);

		secondEntry.resolve(
			createKnowledgeEntry(KNOWLEDGE_ENTRY_B_ID, "Latest entry"),
		);
		await secondRequest;
		firstEntry.resolve(
			createKnowledgeEntry(KNOWLEDGE_ENTRY_A_ID, "Stale entry"),
		);
		await firstRequest;

		const state = store.instance.getState().knowledge;
		expect(state.selectedEntry?.id).toBe(KNOWLEDGE_ENTRY_B_ID);
		expect(state.isEntryLoading).toBe(false);
	});

	it("ignores stale entry failures and notifications after a project change", async () => {
		const firstEntry = createDeferred<KnowledgeEntryResponseDto>();
		vi.spyOn(knowledgeApi, "getKnowledgeEntry").mockReturnValue(
			firstEntry.promise,
		);

		const request = store.instance.dispatch(
			fetchKnowledgeEntry({
				entryId: KNOWLEDGE_ENTRY_A_ID,
				projectId: PROJECT_ID,
			}),
		);
		store.instance.dispatch(actions.resetState(SECOND_PROJECT_ID));
		firstEntry.reject(new Error("stale project failure"));
		await request;

		const state = store.instance.getState().knowledge;
		expect(state.knowledgeErrorMessage).toBeNull();
		expect(notificationListener).not.toHaveBeenCalled();
	});

	it("reconciles a pending-review omission to INTEGRATING without untracking", async () => {
		trackDocumentWithStatus(
			DOCUMENT_A_ID,
			DocumentStatus.WAITING_FOR_VALIDATION,
		);
		addTrackedDocumentId(PROJECT_ID, DOCUMENT_A_ID);
		vi.spyOn(documentsApi, "getPendingReviewDocuments").mockResolvedValue({
			items: [],
		});
		vi.spyOn(documentsApi, "getDocumentStatus").mockResolvedValue(
			createStatusResponse(DOCUMENT_A_ID, DocumentStatus.INTEGRATING),
		);

		await store.instance
			.dispatch(
				fetchPendingReviewDocuments({
					pipelineSessionId:
						store.instance.getState().knowledge.pipelineSessionId,
					projectId: PROJECT_ID,
				}),
			)
			.unwrap();

		expect(store.instance.getState().knowledge.trackedDocuments).toContainEqual(
			expect.objectContaining({
				documentId: DOCUMENT_A_ID,
				status: DocumentStatus.INTEGRATING,
			}),
		);
	});

	it("does not let a stale pending-review snapshot regress an advanced document", () => {
		trackDocumentWithStatus(
			DOCUMENT_A_ID,
			DocumentStatus.WAITING_FOR_VALIDATION,
		);
		const scope = {
			pipelineSessionId: store.instance.getState().knowledge.pipelineSessionId,
			projectId: PROJECT_ID,
		};
		store.instance.dispatch(
			fetchPendingReviewDocuments.pending("pending", scope),
		);
		store.instance.dispatch(
			actions.syncTrackedDocumentStatus({
				...createRequest(DOCUMENT_A_ID),
				status: DocumentStatus.INTEGRATING,
			}),
		);
		store.instance.dispatch(
			fetchPendingReviewDocuments.fulfilled(
				{
					items: [
						createStatusResponse(
							DOCUMENT_A_ID,
							DocumentStatus.WAITING_FOR_VALIDATION,
						),
					],
				},
				"pending",
				scope,
			),
		);

		expect(store.instance.getState().knowledge.trackedDocuments).toContainEqual(
			expect.objectContaining({
				documentId: DOCUMENT_A_ID,
				status: DocumentStatus.INTEGRATING,
			}),
		);
	});

	it("does not resurrect a document removed after pending-review recovery starts", async () => {
		trackDocumentWithStatus(DOCUMENT_A_ID, DocumentStatus.WAITING_FOR_APPROVAL);
		addTrackedDocumentId(PROJECT_ID, DOCUMENT_A_ID);
		const pendingReviews = createDeferred<{
			items: DocumentStatusResponseDto[];
		}>();
		vi.spyOn(documentsApi, "getPendingReviewDocuments").mockReturnValue(
			pendingReviews.promise,
		);
		vi.spyOn(documentsApi, "getDocumentStatus").mockResolvedValue(
			createStatusResponse(DOCUMENT_A_ID, DocumentStatus.COMPLETED),
		);

		const recovery = store.instance.dispatch(
			fetchPendingReviewDocuments({
				pipelineSessionId:
					store.instance.getState().knowledge.pipelineSessionId,
				projectId: PROJECT_ID,
			}),
		);
		await Promise.resolve();
		await store.instance.dispatch(
			pollDocumentStatus(createRequest(DOCUMENT_A_ID)),
		);
		pendingReviews.resolve({
			items: [
				createStatusResponse(
					DOCUMENT_A_ID,
					DocumentStatus.WAITING_FOR_APPROVAL,
				),
			],
		});
		await recovery;

		expect(store.instance.getState().knowledge.trackedDocuments).toEqual([]);
		expect(readTrackedDocumentIds(PROJECT_ID)).not.toContain(DOCUMENT_A_ID);
	});

	it("authoritatively advances an existing pending review", async () => {
		trackDocumentWithStatus(
			DOCUMENT_A_ID,
			DocumentStatus.WAITING_FOR_VALIDATION,
		);
		vi.spyOn(documentsApi, "getPendingReviewDocuments").mockResolvedValue({
			items: [
				createStatusResponse(
					DOCUMENT_A_ID,
					DocumentStatus.WAITING_FOR_APPROVAL,
				),
			],
		});
		vi.spyOn(documentsApi, "getDocumentStatus").mockResolvedValue(
			createStatusResponse(DOCUMENT_A_ID, DocumentStatus.WAITING_FOR_APPROVAL),
		);

		await store.instance.dispatch(
			fetchPendingReviewDocuments({
				pipelineSessionId:
					store.instance.getState().knowledge.pipelineSessionId,
				projectId: PROJECT_ID,
			}),
		);

		expect(store.instance.getState().knowledge.trackedDocuments).toContainEqual(
			expect.objectContaining({
				documentId: DOCUMENT_A_ID,
				status: DocumentStatus.WAITING_FOR_APPROVAL,
			}),
		);
	});

	it("verifies a newly discovered review before tracking it", async () => {
		vi.spyOn(documentsApi, "getPendingReviewDocuments").mockResolvedValue({
			items: [
				createStatusResponse(
					DOCUMENT_A_ID,
					DocumentStatus.WAITING_FOR_VALIDATION,
				),
			],
		});
		vi.spyOn(documentsApi, "getDocumentStatus").mockResolvedValue(
			createStatusResponse(DOCUMENT_A_ID, DocumentStatus.COMPLETED),
		);

		await store.instance.dispatch(
			fetchPendingReviewDocuments({
				pipelineSessionId:
					store.instance.getState().knowledge.pipelineSessionId,
				projectId: PROJECT_ID,
			}),
		);

		expect(store.instance.getState().knowledge.trackedDocuments).toEqual([]);
		expect(readTrackedDocumentIds(PROJECT_ID)).not.toContain(DOCUMENT_A_ID);
	});

	it("ignores an older status response for the same document", async () => {
		trackDocumentWithStatus(DOCUMENT_A_ID, DocumentStatus.PROCESSING);
		const olderStatus = createDeferred<DocumentStatusResponseDto>();
		const newerStatus = createDeferred<DocumentStatusResponseDto>();
		vi.spyOn(documentsApi, "getDocumentStatus")
			.mockReturnValueOnce(olderStatus.promise)
			.mockReturnValueOnce(newerStatus.promise);

		const olderRequest = store.instance.dispatch(
			pollDocumentStatus(createRequest(DOCUMENT_A_ID)),
		);
		const newerRequest = store.instance.dispatch(
			pollDocumentStatus(createRequest(DOCUMENT_A_ID)),
		);

		newerStatus.resolve(
			createStatusResponse(DOCUMENT_A_ID, DocumentStatus.INTEGRATING),
		);
		await newerRequest;
		olderStatus.resolve(
			createStatusResponse(DOCUMENT_A_ID, DocumentStatus.PROCESSING),
		);
		await olderRequest;

		expect(store.instance.getState().knowledge.trackedDocuments).toContainEqual(
			expect.objectContaining({
				documentId: DOCUMENT_A_ID,
				status: DocumentStatus.INTEGRATING,
			}),
		);
	});

	it("persists backend-restored reviews and restores integration polling after re-entry", async () => {
		const pendingDocument = createStatusResponse(
			DOCUMENT_A_ID,
			DocumentStatus.WAITING_FOR_VALIDATION,
		);
		vi.spyOn(documentsApi, "getPendingReviewDocuments").mockResolvedValue({
			items: [pendingDocument],
		});
		vi.spyOn(documentsApi, "getDocumentStatus").mockResolvedValue(
			pendingDocument,
		);
		await store.instance.dispatch(
			fetchPendingReviewDocuments({
				pipelineSessionId:
					store.instance.getState().knowledge.pipelineSessionId,
				projectId: PROJECT_ID,
			}),
		);

		expect(readTrackedDocumentIds(PROJECT_ID)).toContain(DOCUMENT_A_ID);
		store.instance.dispatch(
			actions.syncTrackedDocumentStatus({
				...createRequest(DOCUMENT_A_ID),
				status: DocumentStatus.INTEGRATING,
			}),
		);
		store.instance.dispatch(actions.resetState(SECOND_PROJECT_ID));
		store.instance.dispatch(actions.resetState(PROJECT_ID));
		vi.spyOn(documentsApi, "getPendingReviewDocuments").mockResolvedValue({
			items: [],
		});
		const getStatus = vi
			.spyOn(documentsApi, "getDocumentStatus")
			.mockResolvedValue(
				createStatusResponse(DOCUMENT_A_ID, DocumentStatus.INTEGRATING),
			);

		await store.instance
			.dispatch(initializeProjectKnowledgePipeline({ projectId: PROJECT_ID }))
			.unwrap();

		expect(getStatus).toHaveBeenCalledWith(
			expect.objectContaining({ documentId: DOCUMENT_A_ID }),
		);
		expect(store.instance.getState().knowledge.trackedDocuments).toContainEqual(
			expect.objectContaining({
				documentId: DOCUMENT_A_ID,
				status: DocumentStatus.INTEGRATING,
			}),
		);
	});

	it("reconciles a rejected retry to server PROCESSING without fabricating FAILED", async () => {
		trackDocumentWithStatus(DOCUMENT_A_ID, DocumentStatus.FAILED);
		vi.spyOn(documentsApi, "retryProcessing").mockRejectedValue(
			new Error("response lost"),
		);
		vi.spyOn(documentsApi, "getDocumentStatus").mockResolvedValue(
			createStatusResponse(DOCUMENT_A_ID, DocumentStatus.PROCESSING),
		);

		const result = await store.instance.dispatch(
			retryDocumentProcessing(createRequest(DOCUMENT_A_ID)),
		);

		expect(retryDocumentProcessing.rejected.match(result)).toBe(true);
		const state = store.instance.getState().knowledge;
		expect(state.activeDocumentStatus).toBe(DocumentStatus.PROCESSING);
		expect(state.pipelineErrors[DOCUMENT_A_ID]).toBeUndefined();
	});

	it("keeps authoritative FAILED after a rejected retry when the server is still failed", async () => {
		trackDocumentWithStatus(DOCUMENT_A_ID, DocumentStatus.FAILED);
		vi.spyOn(documentsApi, "retryProcessing").mockRejectedValue(
			new Error("retry conflict"),
		);
		vi.spyOn(documentsApi, "getDocumentStatus").mockResolvedValue(
			createStatusResponse(DOCUMENT_A_ID, DocumentStatus.FAILED),
		);

		const result = await store.instance.dispatch(
			retryDocumentProcessing(createRequest(DOCUMENT_A_ID)),
		);

		expect(retryDocumentProcessing.rejected.match(result)).toBe(true);
		const state = store.instance.getState().knowledge;
		expect(state.activeDocumentStatus).toBe(DocumentStatus.FAILED);
		expect(state.pipelineErrors[DOCUMENT_A_ID]).toBe("retry conflict");
	});

	it("keeps the previous active document when switching status fails", async () => {
		trackDocumentWithStatus(
			DOCUMENT_A_ID,
			DocumentStatus.WAITING_FOR_VALIDATION,
		);
		trackDocumentWithStatus(
			DOCUMENT_B_ID,
			DocumentStatus.WAITING_FOR_VALIDATION,
		);
		vi.spyOn(documentsApi, "getDocumentStatus").mockRejectedValue(
			new Error("status unavailable"),
		);

		await store.instance.dispatch(
			switchActiveDocument(createRequest(DOCUMENT_B_ID)),
		);

		expect(store.instance.getState().knowledge.activeDocumentId).toBe(
			DOCUMENT_A_ID,
		);
		expect(notificationListener).toHaveBeenCalledTimes(SINGLE_CALL_COUNT);
	});

	it("keeps the latest document selection when an older switch settles last", async () => {
		trackDocumentWithStatus(DOCUMENT_A_ID, DocumentStatus.WAITING_FOR_APPROVAL);
		trackDocumentWithStatus(DOCUMENT_B_ID, DocumentStatus.WAITING_FOR_APPROVAL);
		trackDocumentWithStatus(DOCUMENT_C_ID, DocumentStatus.WAITING_FOR_APPROVAL);
		const switchToB = createDeferred<DocumentStatusResponseDto>();
		const switchToC = createDeferred<DocumentStatusResponseDto>();
		vi.spyOn(documentsApi, "getDocumentStatus").mockImplementation(
			({ documentId }) =>
				documentId === DOCUMENT_B_ID ? switchToB.promise : switchToC.promise,
		);

		const olderSwitch = store.instance.dispatch(
			switchActiveDocument(createRequest(DOCUMENT_B_ID)),
		);
		const latestSwitch = store.instance.dispatch(
			switchActiveDocument(createRequest(DOCUMENT_C_ID)),
		);

		switchToC.resolve(
			createStatusResponse(DOCUMENT_C_ID, DocumentStatus.WAITING_FOR_APPROVAL),
		);
		expect(await latestSwitch.unwrap()).toEqual({
			isLatest: true,
			isSwitched: true,
		});
		switchToB.resolve(
			createStatusResponse(DOCUMENT_B_ID, DocumentStatus.WAITING_FOR_APPROVAL),
		);
		expect(await olderSwitch.unwrap()).toEqual({
			isLatest: false,
			isSwitched: false,
		});

		expect(store.instance.getState().knowledge.activeDocumentId).toBe(
			DOCUMENT_C_ID,
		);
	});

	it("does not notify when an older document switch fails", async () => {
		trackDocumentWithStatus(DOCUMENT_A_ID, DocumentStatus.WAITING_FOR_APPROVAL);
		trackDocumentWithStatus(DOCUMENT_B_ID, DocumentStatus.WAITING_FOR_APPROVAL);
		trackDocumentWithStatus(DOCUMENT_C_ID, DocumentStatus.WAITING_FOR_APPROVAL);
		const switchToB = createDeferred<DocumentStatusResponseDto>();
		vi.spyOn(documentsApi, "getDocumentStatus").mockImplementation(
			({ documentId }) =>
				documentId === DOCUMENT_B_ID
					? switchToB.promise
					: Promise.resolve(
							createStatusResponse(
								DOCUMENT_C_ID,
								DocumentStatus.WAITING_FOR_APPROVAL,
							),
						),
		);

		const olderSwitch = store.instance.dispatch(
			switchActiveDocument(createRequest(DOCUMENT_B_ID)),
		);
		await store.instance.dispatch(
			switchActiveDocument(createRequest(DOCUMENT_C_ID)),
		);
		switchToB.reject(new Error("stale switch failure"));
		await olderSwitch;

		expect(store.instance.getState().knowledge.activeDocumentId).toBe(
			DOCUMENT_C_ID,
		);
		expect(notificationListener).not.toHaveBeenCalled();
	});

	it("does not activate a switch target that is now INTEGRATING", async () => {
		trackDocumentWithStatus(
			DOCUMENT_A_ID,
			DocumentStatus.WAITING_FOR_VALIDATION,
		);
		trackDocumentWithStatus(
			DOCUMENT_B_ID,
			DocumentStatus.WAITING_FOR_VALIDATION,
		);
		vi.spyOn(documentsApi, "getDocumentStatus").mockResolvedValue(
			createStatusResponse(DOCUMENT_B_ID, DocumentStatus.INTEGRATING),
		);

		const result = await store.instance
			.dispatch(switchActiveDocument(createRequest(DOCUMENT_B_ID)))
			.unwrap();

		expect(result).toEqual({ isLatest: true, isSwitched: false });
		expect(store.instance.getState().knowledge.activeDocumentId).toBe(
			DOCUMENT_A_ID,
		);
	});

	it("waits for extraction items before declaring a validation preview ready", async () => {
		trackDocumentWithStatus(
			DOCUMENT_A_ID,
			DocumentStatus.WAITING_FOR_VALIDATION,
		);
		vi.spyOn(documentsApi, "getPendingReviewDocuments").mockResolvedValue({
			items: [
				createStatusResponse(
					DOCUMENT_A_ID,
					DocumentStatus.WAITING_FOR_VALIDATION,
				),
			],
		});
		const deferred = createDeferred<ExtractionItemsResponseDto>();
		vi.spyOn(documentsApi, "getExtractionItems").mockReturnValue(
			deferred.promise,
		);

		const resuming = store.instance.dispatch(
			resumeNextPendingReview({ projectId: PROJECT_ID }),
		);
		await Promise.resolve();
		expect(
			store.instance.getState().knowledge.extractionItemsDocumentId,
		).toBeNull();

		deferred.resolve({ failedPageNumbers: [], items: [], sections: [] });
		const result = await resuming.unwrap();

		expect(result.openPreview).toBe(true);
		expect(store.instance.getState().knowledge.extractionItemsDocumentId).toBe(
			DOCUMENT_A_ID,
		);
	});

	it("keeps incomplete-page warnings scoped to the active document", async () => {
		trackDocumentWithStatus(
			DOCUMENT_A_ID,
			DocumentStatus.WAITING_FOR_VALIDATION,
		);
		trackDocumentWithStatus(
			DOCUMENT_B_ID,
			DocumentStatus.WAITING_FOR_VALIDATION,
		);
		const requestA = createRequest(DOCUMENT_A_ID);
		store.instance.dispatch(
			fetchExtractionItems.fulfilled(
				{ failedPageNumbers: [FAILED_PAGE_NUMBER], items: [], sections: [] },
				"extraction-a",
				requestA,
			),
		);
		expect(
			store.instance.getState().knowledge.extractionFailedPageNumbers,
		).toEqual([FAILED_PAGE_NUMBER]);

		vi.spyOn(documentsApi, "getDocumentStatus").mockResolvedValue(
			createStatusResponse(
				DOCUMENT_B_ID,
				DocumentStatus.WAITING_FOR_VALIDATION,
			),
		);
		vi.spyOn(documentsApi, "getExtractionItems").mockResolvedValue({
			failedPageNumbers: [],
			items: [],
			sections: [],
		});
		await store.instance
			.dispatch(switchActiveDocument(createRequest(DOCUMENT_B_ID)))
			.unwrap();
		store.instance.dispatch(
			fetchExtractionItems.fulfilled(
				{ failedPageNumbers: [FAILED_PAGE_NUMBER], items: [], sections: [] },
				"stale-extraction-a",
				requestA,
			),
		);

		expect(store.instance.getState().knowledge.activeDocumentId).toBe(
			DOCUMENT_B_ID,
		);
		expect(
			store.instance.getState().knowledge.extractionFailedPageNumbers,
		).toEqual([]);
	});

	it("clears incomplete-page warnings when changing projects and ignores stale responses", () => {
		trackDocumentWithStatus(
			DOCUMENT_A_ID,
			DocumentStatus.WAITING_FOR_VALIDATION,
		);
		const request = createRequest(DOCUMENT_A_ID);
		const response = {
			failedPageNumbers: [FAILED_PAGE_NUMBER],
			items: [],
			sections: [],
		};
		store.instance.dispatch(
			fetchExtractionItems.fulfilled(response, "extraction", request),
		);
		store.instance.dispatch(actions.resetState(SECOND_PROJECT_ID));
		store.instance.dispatch(
			fetchExtractionItems.fulfilled(response, "stale-extraction", request),
		);
		expect(
			store.instance.getState().knowledge.extractionFailedPageNumbers,
		).toEqual([]);
	});

	it("invalidates extraction readiness when the document advances", () => {
		trackDocumentWithStatus(
			DOCUMENT_A_ID,
			DocumentStatus.WAITING_FOR_VALIDATION,
		);
		const request = createRequest(DOCUMENT_A_ID);
		store.instance.dispatch(
			fetchExtractionItems.fulfilled(
				{ failedPageNumbers: [FAILED_PAGE_NUMBER], items: [], sections: [] },
				"extraction",
				request,
			),
		);
		expect(store.instance.getState().knowledge.extractionItemsDocumentId).toBe(
			DOCUMENT_A_ID,
		);

		store.instance.dispatch(
			actions.syncTrackedDocumentStatus({
				...request,
				status: DocumentStatus.INTEGRATING,
			}),
		);

		expect(
			store.instance.getState().knowledge.extractionItemsDocumentId,
		).toBeNull();
		expect(
			store.instance.getState().knowledge.extractionFailedPageNumbers,
		).toEqual([]);
	});

	it("resyncs an outdated integration apply to INTEGRATING", async () => {
		trackDocumentWithStatus(DOCUMENT_A_ID, DocumentStatus.WAITING_FOR_APPROVAL);
		vi.spyOn(documentsApi, "applyIntegrationChanges").mockRejectedValue(
			new Error("analysis outdated"),
		);
		vi.spyOn(documentsApi, "getDocumentStatus").mockResolvedValue(
			createStatusResponse(DOCUMENT_A_ID, DocumentStatus.INTEGRATING),
		);

		await store.instance.dispatch(
			applyIntegrationChanges({
				...createRequest(DOCUMENT_A_ID),
				payload: { resolutions: [] },
			}),
		);

		const state = store.instance.getState().knowledge;
		expect(state.activeDocumentStatus).toBe(DocumentStatus.INTEGRATING);
		expect(state.integrationPreviewError).toBeNull();
	});

	it("resyncs a stale extraction review after another client advances it", async () => {
		trackDocumentWithStatus(
			DOCUMENT_A_ID,
			DocumentStatus.WAITING_FOR_VALIDATION,
		);
		vi.spyOn(documentsApi, "submitExtractionReview").mockRejectedValue(
			new Error("review conflict"),
		);
		vi.spyOn(documentsApi, "getDocumentStatus").mockResolvedValue(
			createStatusResponse(DOCUMENT_A_ID, DocumentStatus.WAITING_FOR_APPROVAL),
		);

		const result = await store.instance.dispatch(
			submitExtractionReview({
				...createRequest(DOCUMENT_A_ID),
				payload: { approvedIds: [EXTRACTION_ITEM_ID], rejectedIds: [] },
			}),
		);

		expect(submitExtractionReview.rejected.match(result)).toBe(true);
		const state = store.instance.getState().knowledge;
		expect(state.activeDocumentStatus).toBe(
			DocumentStatus.WAITING_FOR_APPROVAL,
		);
		expect(state.pipelineErrors[DOCUMENT_A_ID]).toBeUndefined();
	});

	it("retains a genuine extraction edit failure for the active preview", () => {
		trackDocumentWithStatus(
			DOCUMENT_A_ID,
			DocumentStatus.WAITING_FOR_VALIDATION,
		);
		const request = {
			...createRequest(DOCUMENT_A_ID),
			extractionItemId: EXTRACTION_ITEM_ID,
			payload: { text: "Updated text", title: "Updated title" },
		};
		store.instance.dispatch(updateExtractionItem.pending("update", request));
		store.instance.dispatch(
			updateExtractionItem.rejected(
				new Error("extraction update failed"),
				"update",
				request,
			),
		);

		expect(
			store.instance.getState().knowledge.pipelineErrors[DOCUMENT_A_ID],
		).toBe("extraction update failed");
		expect(notificationListener).not.toHaveBeenCalled();
	});

	it("keeps successful upload confirmation fulfilled when storage writes fail", async () => {
		store.instance.dispatch(actions.acquireUploadSession(PROJECT_ID));
		const uploadSessionId =
			store.instance.getState().knowledge.uploadSession?.id;
		expect(uploadSessionId).toBeDefined();
		vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
			throw new DOMException("blocked", "SecurityError");
		});
		vi.spyOn(documentsApi, "confirmUpload").mockResolvedValue({
			documentId: DOCUMENT_A_ID,
			status: DocumentStatus.PROCESSING,
		});
		vi.spyOn(documentsApi, "getDocumentStatus").mockResolvedValue(
			createStatusResponse(DOCUMENT_A_ID, DocumentStatus.FAILED),
		);

		const result = await store.instance.dispatch(
			confirmDocumentUpload({
				documentId: DOCUMENT_A_ID,
				projectId: PROJECT_ID,
				uploadSessionId: uploadSessionId as number,
			}),
		);

		expect(confirmDocumentUpload.fulfilled.match(result)).toBe(true);
	});

	it("persists a confirmed upload after its UI session is released", async () => {
		store.instance.dispatch(actions.acquireUploadSession(PROJECT_ID));
		const uploadSessionId =
			store.instance.getState().knowledge.uploadSession?.id;
		expect(uploadSessionId).toBeDefined();
		const confirmation = createDeferred<{
			documentId: number;
			status: typeof DocumentStatus.PROCESSING;
		}>();
		vi.spyOn(documentsApi, "confirmUpload").mockReturnValue(
			confirmation.promise,
		);

		const request = store.instance.dispatch(
			confirmDocumentUpload({
				documentId: DOCUMENT_A_ID,
				projectId: PROJECT_ID,
				uploadSessionId: uploadSessionId as number,
			}),
		);
		store.instance.dispatch(actions.releaseUploadSession(PROJECT_ID));
		store.instance.dispatch(actions.resetState(SECOND_PROJECT_ID));
		confirmation.resolve({
			documentId: DOCUMENT_A_ID,
			status: DocumentStatus.PROCESSING,
		});
		await request;

		expect(readTrackedDocumentIds(PROJECT_ID)).toContain(DOCUMENT_A_ID);
		expect(store.instance.getState().knowledge.trackedDocuments).toEqual([]);
	});

	it("keeps successful manual text creation fulfilled when storage writes fail", async () => {
		store.instance.dispatch(actions.acquireUploadSession(PROJECT_ID));
		const uploadSessionId =
			store.instance.getState().knowledge.uploadSession?.id;
		expect(uploadSessionId).toBeDefined();
		vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
			throw new DOMException("quota", "QuotaExceededError");
		});
		const response: ManualTextResponseDto = {
			...createStatusResponse(DOCUMENT_A_ID, DocumentStatus.PROCESSING),
			title: "Manual note",
		};
		vi.spyOn(documentsApi, "createManualText").mockResolvedValue(response);
		vi.spyOn(documentsApi, "getDocumentStatus").mockResolvedValue(
			createStatusResponse(DOCUMENT_A_ID, DocumentStatus.FAILED),
		);

		const result = await store.instance.dispatch(
			submitManualText({
				payload: { content: "Knowledge", title: "Manual note" },
				projectId: PROJECT_ID,
				uploadSessionId: uploadSessionId as number,
			}),
		);

		expect(submitManualText.fulfilled.match(result)).toBe(true);
	});

	it("persists created manual text after its UI session is released", async () => {
		store.instance.dispatch(actions.acquireUploadSession(PROJECT_ID));
		const uploadSessionId =
			store.instance.getState().knowledge.uploadSession?.id;
		expect(uploadSessionId).toBeDefined();
		const manualText = createDeferred<ManualTextResponseDto>();
		vi.spyOn(documentsApi, "createManualText").mockReturnValue(
			manualText.promise,
		);

		const request = store.instance.dispatch(
			submitManualText({
				payload: { content: "Knowledge", title: "Manual note" },
				projectId: PROJECT_ID,
				uploadSessionId: uploadSessionId as number,
			}),
		);
		store.instance.dispatch(actions.releaseUploadSession(PROJECT_ID));
		store.instance.dispatch(actions.resetState(SECOND_PROJECT_ID));
		manualText.resolve({
			...createStatusResponse(DOCUMENT_A_ID, DocumentStatus.PROCESSING),
			title: "Manual note",
		});
		await request;

		expect(readTrackedDocumentIds(PROJECT_ID)).toContain(DOCUMENT_A_ID);
		expect(store.instance.getState().knowledge.trackedDocuments).toEqual([]);
	});

	it("does not throw while untracking when storage removal fails", () => {
		trackDocumentWithStatus(DOCUMENT_A_ID, DocumentStatus.PROCESSING);
		vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
			throw new DOMException("blocked", "SecurityError");
		});

		expect(() => {
			void store.instance.dispatch(
				untrackDocument({
					documentId: DOCUMENT_A_ID,
					projectId: PROJECT_ID,
				}),
			);
		}).not.toThrow();
	});

	it("does not publish global alerts for automatic polling failures", () => {
		trackDocumentWithStatus(DOCUMENT_A_ID, DocumentStatus.PROCESSING);
		store.instance.dispatch(
			pollDocumentStatus.rejected(
				new Error("offline"),
				"poll",
				createRequest(DOCUMENT_A_ID),
			),
		);

		expect(notificationListener).not.toHaveBeenCalled();
	});

	it("notifies when pending-review recovery fails", async () => {
		vi.spyOn(documentsApi, "getPendingReviewDocuments").mockRejectedValue(
			new Error("recovery unavailable"),
		);

		await store.instance.dispatch(
			fetchPendingReviewDocuments({
				pipelineSessionId:
					store.instance.getState().knowledge.pipelineSessionId,
				projectId: PROJECT_ID,
			}),
		);

		expect(notificationListener).toHaveBeenCalledTimes(SINGLE_CALL_COUNT);
	});

	it("does not retry permanent polling failures", async () => {
		trackDocumentWithStatus(DOCUMENT_A_ID, DocumentStatus.PROCESSING);
		const getStatus = vi
			.spyOn(documentsApi, "getDocumentStatus")
			.mockRejectedValue({ message: "not found", status: 404 });

		await store.instance.dispatch(
			pollDocumentStatus(createRequest(DOCUMENT_A_ID)),
		);
		await vi.advanceTimersByTimeAsync(POLL_RETRY_DELAY_MS);

		expect(getStatus).toHaveBeenCalledTimes(SINGLE_CALL_COUNT);
		expect(
			store.instance.getState().knowledge.pipelineErrors[DOCUMENT_A_ID],
		).toBe("not found");
	});

	it("applies concurrent successful updates for different entries", async () => {
		const treeRequest = { projectId: PROJECT_ID };
		store.instance.dispatch(fetchKnowledgeTree.pending("tree", treeRequest));
		store.instance.dispatch(
			fetchKnowledgeTree.fulfilled(
				{
					items: [
						{
							id: KNOWLEDGE_ENTRY_A_ID,
							parentId: null,
							position: 0,
							title: "Entry A",
							type: KnowledgeNodeType.ENTRY,
							updatedAt: "2026-09-28T00:00:00.000Z",
						},
						{
							id: KNOWLEDGE_ENTRY_B_ID,
							parentId: null,
							position: 1,
							title: "Entry B",
							type: KnowledgeNodeType.ENTRY,
							updatedAt: "2026-09-28T00:00:00.000Z",
						},
					],
				},
				"tree",
				treeRequest,
			),
		);
		const updateA = createDeferred<KnowledgeEntryResponseDto>();
		const updateB = createDeferred<KnowledgeEntryResponseDto>();
		vi.spyOn(knowledgeApi, "updateKnowledgeEntry").mockImplementation(
			({ entryId }) =>
				entryId === KNOWLEDGE_ENTRY_A_ID ? updateA.promise : updateB.promise,
		);

		const requestA = store.instance.dispatch(
			updateKnowledgeEntry({
				entryId: KNOWLEDGE_ENTRY_A_ID,
				payload: { contentJson: [], title: "Updated A" },
				projectId: PROJECT_ID,
			}),
		);
		const requestB = store.instance.dispatch(
			updateKnowledgeEntry({
				entryId: KNOWLEDGE_ENTRY_B_ID,
				payload: { contentJson: [], title: "Updated B" },
				projectId: PROJECT_ID,
			}),
		);
		updateB.resolve(createKnowledgeEntry(KNOWLEDGE_ENTRY_B_ID, "Updated B"));
		await requestB;
		updateA.resolve(createKnowledgeEntry(KNOWLEDGE_ENTRY_A_ID, "Updated A"));
		await requestA;

		expect(store.instance.getState().knowledge.tree).toEqual([
			expect.objectContaining({ id: KNOWLEDGE_ENTRY_A_ID, title: "Updated A" }),
			expect.objectContaining({ id: KNOWLEDGE_ENTRY_B_ID, title: "Updated B" }),
		]);
		expect(notificationListener).toHaveBeenCalledTimes(TWO_CALL_COUNT);
	});

	it("does not notify when an entry update finishes after a project change", async () => {
		const update = createDeferred<KnowledgeEntryResponseDto>();
		vi.spyOn(knowledgeApi, "updateKnowledgeEntry").mockReturnValue(
			update.promise,
		);

		const request = store.instance.dispatch(
			updateKnowledgeEntry({
				entryId: KNOWLEDGE_ENTRY_A_ID,
				payload: { contentJson: [], title: "Updated" },
				projectId: PROJECT_ID,
			}),
		);
		store.instance.dispatch(actions.resetState(SECOND_PROJECT_ID));
		update.resolve(createKnowledgeEntry(KNOWLEDGE_ENTRY_A_ID, "Updated"));
		await request;

		expect(notificationListener).not.toHaveBeenCalled();
		expect(store.instance.getState().knowledge.selectedEntry).toBeNull();
	});

	it("does not notify for a rejected action from an old pipeline session", () => {
		trackDocumentWithStatus(DOCUMENT_A_ID, DocumentStatus.FAILED);
		const staleRequest = createRequest(DOCUMENT_A_ID);
		store.instance.dispatch(actions.resetState(SECOND_PROJECT_ID));

		store.instance.dispatch(
			retryDocumentProcessing.rejected(
				new Error("stale retry"),
				"retry",
				staleRequest,
			),
		);

		expect(notificationListener).not.toHaveBeenCalled();
	});

	it("keeps Add Knowledge locked while any tracked document is in flight", () => {
		trackDocumentWithStatus(
			DOCUMENT_A_ID,
			DocumentStatus.WAITING_FOR_VALIDATION,
		);
		trackDocumentWithStatus(DOCUMENT_B_ID, DocumentStatus.PROCESSING);

		expect(store.instance.getState().knowledge.isAddingKnowledge).toBe(true);
	});
});
