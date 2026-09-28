import {
	DocumentStatus,
	ExtractionItemStatus,
	KnowledgeNodeType,
} from "@knowledgeprism/constants";
import { type ExtractionItemResponseDto } from "@knowledgeprism/types";
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import { type JSX, type ReactElement } from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { store } from "~/lib/store/store.js";
import { workspacesActions } from "~/modules/workspaces/state/workspaces.slice.js";

import { mapExtractionItemsToProposedStructure } from "../../libs/helpers/helpers.js";
import { type ProposedSection } from "../../libs/types/types.js";
import { actions } from "../../state/knowledge.slice.js";
import { LoadingState } from "../loading-state/loading-state.js";
import { IntegrationPreview } from "./integration-preview.js";
import { useGlossaryConsistencyCheck } from "./libs/hooks/use-glossary-consistency-check.hook.js";

vi.mock("./libs/hooks/use-glossary-consistency-check.hook.js", () => ({
	useGlossaryConsistencyCheck: vi.fn(() => ({
		glossaryMatches: [],
		isCheckingGlossary: false,
		onAcceptGlossarySuggestion: vi.fn(),
		onKeepGlossarySuggestion: vi.fn(),
	})),
}));

const TEST_PROJECT_ID = "project-a";

// IntegrationPreview's section details dispatch a glossary consistency check
// (kp-419), which needs a Redux store and a resolvable current project id.
const renderPreview = (ui: ReactElement): ReturnType<typeof render> =>
	render(
		<Provider store={store.instance}>
			<MemoryRouter>{ui}</MemoryRouter>
		</Provider>,
	);

vi.mock("~/components/knowledge-editor/knowledge-editor.js", () => ({
	KnowledgeEditor: (): JSX.Element => <div data-testid="knowledge-editor" />,
}));

const createExtractionItem = (): ExtractionItemResponseDto => ({
	confidence: 0.92,
	id: 17,
	rationale: "The source explicitly states this fact.",
	sourceExcerpt: "KnowledgePrism keeps approved knowledge traceable.",
	sourcePageNumber: 3,
	status: ExtractionItemStatus.PENDING,
	text: "Approved knowledge remains linked to its source.",
	title: "Source traceability",
});

const createDeferred = (): PromiseWithResolvers<boolean> =>
	Promise.withResolvers<boolean>();

describe("IntegrationPreview extraction review", () => {
	beforeEach(() => {
		store.instance.dispatch(actions.resetState(null));
		store.instance.dispatch(
			workspacesActions.setLastActiveProject(TEST_PROJECT_ID),
		);
		vi.mocked(useGlossaryConsistencyCheck).mockReturnValue({
			glossaryMatches: [],
			isCheckingGlossary: false,
			onAcceptGlossarySuggestion: vi.fn(),
			onKeepGlossarySuggestion: vi.fn(),
		});
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("shows each extraction item's source page and excerpt", () => {
		renderPreview(
			<IntegrationPreview
				onAddMore={vi.fn()}
				onApproveExtraction={vi.fn().mockResolvedValue(false)}
				onClose={vi.fn()}
				proposedStructure={mapExtractionItemsToProposedStructure([
					createExtractionItem(),
				])}
				variant="extraction-validation"
			/>,
		);

		expect(screen.getByText("Source page: 3")).toBeInTheDocument();
		expect(
			screen.getByText(
				"Source excerpt: KnowledgePrism keeps approved knowledge traceable.",
			),
		).toBeInTheDocument();
	});

	it("does not allow editing a synthetic source-page group title", () => {
		renderPreview(
			<IntegrationPreview
				onAddMore={vi.fn()}
				onApproveExtraction={vi.fn().mockResolvedValue(false)}
				onClose={vi.fn()}
				proposedStructure={mapExtractionItemsToProposedStructure([
					createExtractionItem(),
				])}
				variant="extraction-validation"
			/>,
		);

		fireEvent.click(
			screen.getByRole("button", { name: /Extracted from Page 3/u }),
		);

		expect(screen.getByRole("button", { name: "Edit" })).toBeDisabled();
	});

	it("dismisses a glossary suggestion and enters edit mode when its Edit action is used", () => {
		const handleKeep = vi.fn();
		const match = {
			canonicalName: "API",
			explanation: "Spells out the canonical term instead of using it.",
			matchedTermId: 1,
			sourceExcerpt: "application programming interface",
			suggestedText: "API",
		};
		vi.mocked(useGlossaryConsistencyCheck).mockReturnValue({
			glossaryMatches: [match],
			isCheckingGlossary: false,
			onAcceptGlossarySuggestion: vi.fn(),
			onKeepGlossarySuggestion: handleKeep,
		});

		renderPreview(
			<IntegrationPreview
				onAddMore={vi.fn()}
				onApproveExtraction={vi.fn().mockResolvedValue(false)}
				onClose={vi.fn()}
				proposedStructure={mapExtractionItemsToProposedStructure([
					createExtractionItem(),
				])}
				variant="extraction-validation"
			/>,
		);

		const suggestionPanel = screen
			.getByText("Glossary suggestions (1)")
			.closest("div")?.parentElement;

		if (!suggestionPanel) {
			throw new Error("Glossary suggestions panel not found");
		}

		fireEvent.click(
			within(suggestionPanel).getByRole("button", { name: "Edit" }),
		);

		expect(handleKeep).toHaveBeenCalledWith(match);
		expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
	});

	it("disables Back, Edit, and structure navigation while approval is applying", async () => {
		const deferred = createDeferred();
		const approve = vi.fn(() => deferred.promise);
		const handleApplyingChange = vi.fn();
		renderPreview(
			<IntegrationPreview
				onAddMore={vi.fn()}
				onApplyingChange={handleApplyingChange}
				onApproveExtraction={approve}
				onClose={vi.fn()}
				proposedStructure={mapExtractionItemsToProposedStructure([
					createExtractionItem(),
				])}
				variant="extraction-validation"
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Approve & save" }));
		await waitFor(() => {
			expect(approve).toHaveBeenCalledOnce();
		});
		expect(handleApplyingChange).toHaveBeenLastCalledWith(true);

		expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Edit" })).toBeDisabled();
		expect(
			screen.getByRole("button", { name: /Extracted from Page 3/u }),
		).toBeDisabled();

		await act(async () => {
			deferred.resolve(false);
			await deferred.promise;
		});
		expect(handleApplyingChange).toHaveBeenLastCalledWith(false);
	});

	it("shows a document-scoped extraction review error", () => {
		renderPreview(
			<IntegrationPreview
				errorMessage="Extraction update failed"
				onAddMore={vi.fn()}
				onApproveExtraction={vi.fn()}
				onClose={vi.fn()}
				proposedStructure={mapExtractionItemsToProposedStructure([
					createExtractionItem(),
				])}
				variant="extraction-validation"
			/>,
		);

		expect(screen.getByText("Review could not be saved")).toBeInTheDocument();
		expect(screen.getByText("Extraction update failed")).toBeInTheDocument();
	});

	it("disables merge Cancel and Publish while integration apply is active", async () => {
		const deferred = createDeferred();
		const approve = vi.fn(() => deferred.promise);
		const structure: ProposedSection[] = [
			{
				id: "section",
				pages: [
					{
						content: "Incoming content",
						id: "page",
						integrationChangeId: 9,
						matchedNodeId: 3,
						originalContent: "Live content",
						originalTitle: "Live title",
						status: "conflict",
						title: "Incoming title",
						type: KnowledgeNodeType.PAGE,
					},
				],
				status: "conflict",
				title: "Section",
				type: KnowledgeNodeType.SECTION,
			},
		];
		renderPreview(
			<IntegrationPreview
				onAddMore={vi.fn()}
				onApprove={approve}
				onClose={vi.fn()}
				proposedStructure={structure}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Approve & save" }));
		fireEvent.click(screen.getByRole("button", { name: "Publish resolution" }));
		await waitFor(() => {
			expect(approve).toHaveBeenCalledOnce();
		});

		expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
		expect(
			screen.getByRole("button", { name: "Publish resolution" }),
		).toBeDisabled();

		await act(async () => {
			deferred.resolve(false);
			await deferred.promise;
		});
	});

	it("lets an extraction error replace a previously ready compact preview", () => {
		vi.useFakeTimers();
		const { rerender } = render(
			<LoadingState
				currentStatus={DocumentStatus.WAITING_FOR_VALIDATION}
				onPreview={vi.fn()}
				variant="compact"
			/>,
		);

		act(() => {
			vi.runAllTimers();
		});
		expect(
			screen.getByRole("button", { name: "Preview is ready" }),
		).toBeInTheDocument();

		rerender(
			<LoadingState
				currentStatus={DocumentStatus.WAITING_FOR_VALIDATION}
				hasError={true}
				onCancel={vi.fn()}
				onRetry={vi.fn()}
				variant="compact"
			/>,
		);

		expect(screen.getByText("Processing failed")).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Preview is ready" }),
		).not.toBeInTheDocument();
	});
});
