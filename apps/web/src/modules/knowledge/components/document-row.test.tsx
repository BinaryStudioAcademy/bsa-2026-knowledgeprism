import {
	DocumentProcessingPhase,
	DocumentSourceType,
	DocumentStatus,
} from "@knowledgeprism/constants";
import { type DocumentStatusResponseDto } from "@knowledgeprism/types";
import { act, cleanup, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { afterEach, describe, expect, it, vi } from "vitest";

import { store } from "~/lib/store/store.js";

import { DocumentProcessingStatus } from "../libs/enums/enums.js";
import { submitExtractionReview } from "../state/actions.js";
import { actions } from "../state/knowledge.slice.js";
import { DocumentRow } from "./document-row.js";

const EXTRACTION_ITEM_ID = 1;
const SNAPSHOT: DocumentStatusResponseDto = {
	createdAt: "2026-09-30T00:00:00Z",
	errorMessage: null,
	id: 1,
	name: "Source.pdf",
	processingAttempt: 1,
	processingProgress: {
		failedUnits: 0,
		phase: DocumentProcessingPhase.EXTRACTING,
		processedUnits: 20,
		totalUnits: 20,
	},
	projectId: 1,
	sourceType: DocumentSourceType.UPLOAD,
	status: DocumentStatus.WAITING_FOR_VALIDATION,
	updatedAt: "2026-09-30T00:00:00Z",
};

describe("document row progress", () => {
	afterEach(() => {
		cleanup();
		store.instance.dispatch(actions.resetState(null));
	});

	it("shows integration immediately after review submission, before the next status poll", () => {
		const projectId = String(SNAPSHOT.projectId);
		store.instance.dispatch(actions.resetState(projectId));
		const scope = {
			documentId: SNAPSHOT.id,
			pipelineSessionId: store.instance.getState().knowledge.pipelineSessionId,
			projectId,
		};
		store.instance.dispatch(
			actions.trackDocument({
				documentId: SNAPSHOT.id,
				label: SNAPSHOT.name,
				projectId,
			}),
		);
		store.instance.dispatch(
			actions.syncTrackedDocumentStatus({
				...scope,
				snapshot: SNAPSHOT,
				status: SNAPSHOT.status,
			}),
		);
		render(
			<Provider store={store.instance}>
				<DocumentRow
					isDisabled={false}
					item={{
						documentId: SNAPSHOT.id,
						id: "uploaded-source",
						name: SNAPSHOT.name,
						size: 1024,
						sizeLabel: "1 KB",
						status: DocumentProcessingStatus.READY,
					}}
					onCancel={vi.fn()}
					onRemove={vi.fn()}
					onRetry={vi.fn()}
				/>
			</Provider>,
		);
		expect(
			screen.getByText("Ready for review: 20 of 20 chunks processed — 100%"),
		).toBeInTheDocument();

		const reviewSubmitted = submitExtractionReview.fulfilled(
			{ documentId: SNAPSHOT.id, status: DocumentStatus.INTEGRATING },
			"review-request",
			{
				...scope,
				payload: { approvedIds: [EXTRACTION_ITEM_ID], rejectedIds: [] },
			},
		);
		act(() => {
			store.instance.dispatch(reviewSubmitted);
		});

		expect(screen.getByText("Analyzing integration")).toBeInTheDocument();
		expect(screen.queryByText(/Ready for review/u)).not.toBeInTheDocument();
		expect(screen.queryByText(/100%/u)).not.toBeInTheDocument();
		expect(
			screen.getByRole("progressbar", { name: "Analyzing integration" }),
		).not.toHaveAttribute("aria-valuenow");
		expect(
			store.instance.getState().knowledge.documentStatuses[SNAPSHOT.id],
		).toEqual(SNAPSHOT);
	});
});
