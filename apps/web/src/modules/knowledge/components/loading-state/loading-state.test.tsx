import {
	DocumentProcessingPhase,
	DocumentSourceType,
	DocumentStatus,
} from "@knowledgeprism/constants";
import { type DocumentProcessingProgressDto } from "@knowledgeprism/types";
import { cleanup, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { afterEach, describe, expect, it, vi } from "vitest";

import { store } from "~/lib/store/store.js";

import { actions } from "../../state/knowledge.slice.js";
import { DocumentProcessingList } from "./document-processing-list.js";
import { ProcessingProgress } from "./libs/components/processing-progress.js";
import { LoadingState } from "./loading-state.js";

const PROGRESS: DocumentProcessingProgressDto = {
	failedUnits: 0,
	phase: DocumentProcessingPhase.EXTRACTING,
	processedUnits: 14,
	totalUnits: 20,
};
const COMPLETE_COUNT = 20;

describe("document processing progress", () => {
	afterEach(() => {
		cleanup();
		store.instance.dispatch(actions.resetState(null));
	});

	it("renders independent progress for every document in a batch", () => {
		const projectId = "batch-project";
		store.instance.dispatch(actions.resetState(projectId));
		const pipelineSessionId =
			store.instance.getState().knowledge.pipelineSessionId;
		for (const document of [
			{ id: 1, name: "First.pdf", processedUnits: 14 },
			{ id: 2, name: "Second.pdf", processedUnits: 4 },
		]) {
			store.instance.dispatch(
				actions.trackDocument({
					documentId: document.id,
					label: document.name,
					projectId,
				}),
			);
			store.instance.dispatch(
				actions.syncTrackedDocumentStatus({
					documentId: document.id,
					pipelineSessionId,
					projectId,
					snapshot: {
						createdAt: "2026-09-30T00:00:00Z",
						errorMessage: null,
						id: document.id,
						name: document.name,
						processingAttempt: 1,
						processingProgress: {
							...PROGRESS,
							processedUnits: document.processedUnits,
						},
						projectId: 1,
						sourceType: DocumentSourceType.UPLOAD,
						status: DocumentStatus.PROCESSING,
						updatedAt: "2026-09-30T00:00:00Z",
					},
					status: DocumentStatus.PROCESSING,
				}),
			);
		}
		render(
			<Provider store={store.instance}>
				<DocumentProcessingList />
			</Provider>,
		);
		expect(
			screen.getByRole("list", { name: "Document processing progress" }),
		).toBeInTheDocument();
		expect(screen.getByText("First.pdf")).toBeInTheDocument();
		expect(screen.getByText("Second.pdf")).toBeInTheDocument();
		expect(
			screen.getByText("Extracting knowledge: 14 of 20 chunks processed — 70%"),
		).toBeInTheDocument();
		expect(
			screen.getByText("Extracting knowledge: 4 of 20 chunks processed — 20%"),
		).toBeInTheDocument();
	});

	it("shows actual counters and an accessible percentage", () => {
		render(
			<LoadingState
				currentStatus={DocumentStatus.PROCESSING}
				progress={PROGRESS}
			/>,
		);
		expect(
			screen.getByText("Extracting knowledge: 14 of 20 chunks processed — 70%"),
		).toBeInTheDocument();
		expect(screen.getByRole("progressbar")).toHaveAttribute(
			"aria-valuenow",
			"70",
		);
	});
	it("remains indeterminate while reading and when the total is unknown", () => {
		render(
			<LoadingState
				currentStatus={DocumentStatus.PROCESSING}
				progress={{
					...PROGRESS,
					phase: DocumentProcessingPhase.READING,
					processedUnits: 0,
					totalUnits: null,
				}}
			/>,
		);
		expect(screen.getByText("Reading document")).toBeInTheDocument();
		expect(screen.getByRole("progressbar")).not.toHaveAttribute(
			"aria-valuenow",
		);
		expect(screen.queryByText(/%/u)).not.toBeInTheDocument();
	});
	it("shows incomplete units when extraction is ready for human review", () => {
		render(
			<LoadingState
				currentStatus={DocumentStatus.WAITING_FOR_VALIDATION}
				onPreview={vi.fn()}
				progress={{
					...PROGRESS,
					failedUnits: 2,
					processedUnits: COMPLETE_COUNT,
				}}
				variant="compact"
			/>,
		);
		expect(
			screen.getByText("Ready for review: 20 of 20 chunks processed — 100%"),
		).toBeInTheDocument();
		expect(
			screen.getByText("2 chunks failed or incomplete"),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Review extraction" }),
		).toBeInTheDocument();
		expect(screen.queryByText("Published")).not.toBeInTheDocument();
	});
	it("uses item counters for integration and still requires final approval", () => {
		render(
			<LoadingState
				currentStatus={DocumentStatus.WAITING_FOR_APPROVAL}
				onPreview={vi.fn()}
				progress={{
					...PROGRESS,
					phase: DocumentProcessingPhase.INTEGRATING,
					processedUnits: COMPLETE_COUNT,
				}}
				variant="compact"
			/>,
		);
		expect(
			screen.getByText("Ready for approval: 20 of 20 items processed — 100%"),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Review integration" }),
		).toBeInTheDocument();
	});
	it("does not reuse extraction's completed percentage while integration initializes", () => {
		render(
			<LoadingState
				currentStatus={DocumentStatus.INTEGRATING}
				progress={{ ...PROGRESS, processedUnits: COMPLETE_COUNT }}
			/>,
		);
		expect(screen.getByRole("progressbar")).not.toHaveAttribute(
			"aria-valuenow",
		);
		expect(screen.queryByText(/100%/u)).not.toBeInTheDocument();
	});
	it("does not invent completed work when the source has no extractable chunks", () => {
		render(
			<ProcessingProgress
				currentStatus={DocumentStatus.WAITING_FOR_VALIDATION}
				progress={{ ...PROGRESS, processedUnits: 0, totalUnits: 0 }}
			/>,
		);
		expect(
			screen.getByText("Ready for review: 0 of 0 chunks processed"),
		).toBeInTheDocument();
		expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
	});
});
