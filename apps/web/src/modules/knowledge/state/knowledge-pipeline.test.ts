import { DocumentSourceType, DocumentStatus } from "@knowledgeprism/constants";
import {
	type DocumentStatusResponseDto,
	type ExtractionItemsResponseDto,
	type ManualTextResponseDto,
} from "@knowledgeprism/types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { errorService } from "~/lib/errors/error.service.js";
import { store } from "~/lib/store/store.js";
import { type AppError } from "~/lib/types/app-error.type.js";

import { documentsApi } from "../knowledge.js";
import {
	addTrackedDocumentId,
	readTrackedDocumentIds,
} from "../libs/helpers/helpers.js";
import {
	applyIntegrationChanges,
	confirmDocumentUpload,
	fetchExtractionItems,
	fetchKnowledgeEntry,
	fetchPendingReviewDocuments,
	initializeProjectKnowledgePipeline,
	pollDocumentStatus,
	resumeNextPendingReview,
	retryDocumentProcessing,
	submitExtractionReview,
	submitManualText,
	switchActiveDocument,
} from "./actions.js";
import { actions } from "./knowledge.slice.js";

const PROJECT_ID = "project-a";
const SECOND_PROJECT_ID = "project-b";
const DOCUMENT_A_ID = 11;
const DOCUMENT_B_ID = 12;
const EXTRACTION_ITEM_ID = 1;
const POLL_RETRY_DELAY_MS = 30_000;
const SINGLE_CALL_COUNT = 1;

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
	let unsubscribeErrors: () => void;
	let notificationListener: ReturnType<typeof vi.fn<(error: AppError) => void>>;

	beforeEach(() => {
		vi.useFakeTimers();
		sessionStorage.clear();
		store.instance.dispatch(actions.resetState(PROJECT_ID));
		notificationListener = vi.fn<(error: AppError) => void>();
		unsubscribeErrors = errorService.subscribe(notificationListener);
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
		unsubscribeErrors();
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

		store.instance.dispatch(
			actions.untrackDocument({
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
		store.instance.dispatch(
			actions.untrackDocument({
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

	it("keeps an active document error while a background document polls", () => {
		trackDocumentWithStatus(
			DOCUMENT_A_ID,
			DocumentStatus.WAITING_FOR_VALIDATION,
		);
		trackDocumentWithStatus(DOCUMENT_B_ID, DocumentStatus.PROCESSING);
		const requestA = createRequest(DOCUMENT_A_ID);
		const requestB = createRequest(DOCUMENT_B_ID);

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

	it("keeps Knowledge Entry failures separate from pipeline health", () => {
		trackDocumentWithStatus(DOCUMENT_A_ID, DocumentStatus.PROCESSING);
		store.instance.dispatch(
			fetchKnowledgeEntry.rejected(new Error("entry failed"), "entry", {
				entryId: 1,
				projectId: PROJECT_ID,
			}),
		);

		const state = store.instance.getState().knowledge;
		expect(state.knowledgeErrorMessage).toBe("entry failed");
		expect(state.pipelineErrors[DOCUMENT_A_ID]).toBeUndefined();
		expect(state.activeDocumentStatus).toBe(DocumentStatus.PROCESSING);
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

	it("persists backend-restored reviews and restores integration polling after re-entry", async () => {
		const pendingDocument = createStatusResponse(
			DOCUMENT_A_ID,
			DocumentStatus.WAITING_FOR_VALIDATION,
		);
		store.instance.dispatch(
			fetchPendingReviewDocuments.fulfilled(
				{ items: [pendingDocument] },
				"pending",
				{
					pipelineSessionId:
						store.instance.getState().knowledge.pipelineSessionId,
					projectId: PROJECT_ID,
				},
			),
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

		const isSwitched = await store.instance
			.dispatch(switchActiveDocument(createRequest(DOCUMENT_B_ID)))
			.unwrap();

		expect(isSwitched).toBe(false);
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

		deferred.resolve({ items: [] });
		const result = await resuming.unwrap();

		expect(result.openPreview).toBe(true);
		expect(store.instance.getState().knowledge.extractionItemsDocumentId).toBe(
			DOCUMENT_A_ID,
		);
	});

	it("invalidates extraction readiness when the document advances", () => {
		trackDocumentWithStatus(
			DOCUMENT_A_ID,
			DocumentStatus.WAITING_FOR_VALIDATION,
		);
		const request = createRequest(DOCUMENT_A_ID);
		store.instance.dispatch(
			fetchExtractionItems.fulfilled({ items: [] }, "extraction", request),
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

	it("does not throw while untracking when storage removal fails", () => {
		trackDocumentWithStatus(DOCUMENT_A_ID, DocumentStatus.PROCESSING);
		vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
			throw new DOMException("blocked", "SecurityError");
		});

		expect(() => {
			store.instance.dispatch(
				actions.untrackDocument({
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
