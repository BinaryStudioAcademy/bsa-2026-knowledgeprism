import {
	DocumentStatus,
	ExtractionItemStatus,
	IntegrationChangeType,
	KnowledgeNodeType,
} from "@knowledgeprism/constants";
import {
	ExtractionHeadingLevel,
	type ExtractionItemResponseDto,
	type IntegrationChangeResponseDto,
} from "@knowledgeprism/types";
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
import { mapIntegrationChangesToProposedStructure } from "../../libs/helpers/map-integration-changes-to-proposed-structure.helper.js";
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
const INTEGRATION_CHANGE_ID = 42;

const renderPreview = (ui: ReactElement): ReturnType<typeof render> =>
	render(
		<Provider store={store.instance}>
			<MemoryRouter>{ui}</MemoryRouter>
		</Provider>,
	);

vi.mock("~/components/knowledge-editor/knowledge-editor.js", () => ({
	KnowledgeEditor: ({
		initialContent,
	}: {
		initialContent?: { content?: unknown; type?: string }[];
	}): JSX.Element => (
		<div data-testid="knowledge-editor">
			{initialContent?.map((block, index) => (
				<span key={`${block.type ?? "block"}-${String(index)}`}>
					{block.type}
				</span>
			))}
		</div>
	),
}));

const createExtractionItem = (): ExtractionItemResponseDto => ({
	confidence: 0.92,
	extractionSectionId: null,
	heading: null,
	id: 17,
	position: 0,
	rationale: "The source explicitly states this fact.",
	sourceExcerpt: "KnowledgePrism keeps approved knowledge traceable.",
	sourcePageNumber: 3,
	status: ExtractionItemStatus.PENDING,
	text: "Approved knowledge remains linked to its source.",
	title: "Source traceability",
});

const createPlacementStructure = (
	item: ExtractionItemResponseDto,
): ProposedSection[] => [
	{
		id: "proposed-changes-section",
		pages: [
			{
				content: item.text,
				id: String(item.id),
				integrationChangeId: INTEGRATION_CHANGE_ID,
				status: "created",
				title: item.title,
				type: KnowledgeNodeType.ENTRY,
			},
		],
		status: "created",
		title: "Proposed changes",
		type: KnowledgeNodeType.SECTION,
	},
];

const createDeferred = (): PromiseWithResolvers<boolean> =>
	Promise.withResolvers<boolean>();

const FAILED_PAGE_NUMBER = 4;
const KB_PAGE_ID = 40;
const INITIAL_ITEM_COUNT = 2;
const PARAGRAPH_BLOCK_COUNT = 2;
const REMAINING_ITEM_COUNT = 1;
const SINGLE_CALL_COUNT = 1;
const CHILD_ITEM_ID = 18;
const GRANDCHILD_ITEM_ID = 19;
const CHANGE_ID_OFFSET = 100;

const createNestedReview = (): {
	placement: ProposedSection[];
	proposal: ProposedSection[];
} => {
	const parent = createExtractionItem();
	const items = [
		parent,
		{ ...parent, id: CHILD_ITEM_ID, title: "Child section" },
		{ ...parent, id: GRANDCHILD_ITEM_ID, title: "Grandchild section" },
	];
	const changes: IntegrationChangeResponseDto[] = items.map((item, index) => {
		const previous = items.at(index - REMAINING_ITEM_COUNT);
		const parentExtractionItemId =
			index === FIRST_ITEM_INDEX ? null : (previous?.id ?? null);

		return {
			explanation: "Preserve nesting.",
			extractionItemId: item.id,
			id: item.id + CHANGE_ID_OFFSET,
			incomingContent: item.text,
			incomingTitle: item.title,
			liveContent: null,
			liveTitle: null,
			matchedNodeId: null,
			placement: {
				matches: [],
				parentExtractionItemId,
				parentId: null,
				parentTitle:
					index === FIRST_ITEM_INDEX ? null : (previous?.title ?? null),
				proposesParent: true,
				siblingOrder: index,
			},
			score: null,
			type: IntegrationChangeType.NEW,
		};
	});

	return {
		placement: mapIntegrationChangesToProposedStructure({ items: changes }),
		proposal: mapExtractionItemsToProposedStructure(items),
	};
};

const FIRST_ITEM_INDEX = 0;
describe("IntegrationPreview extraction review", () => {
	const originalShowModal = Object.getOwnPropertyDescriptor(
		HTMLDialogElement.prototype,
		"showModal",
	);
	const originalClose = Object.getOwnPropertyDescriptor(
		HTMLDialogElement.prototype,
		"close",
	);

	beforeEach(() => {
		HTMLDialogElement.prototype.showModal = () => {
			openTestDialog("Reject Knowledge item");
		};
		HTMLDialogElement.prototype.close = closeTestDialogs;
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
		restoreDialogMethod("showModal", originalShowModal);
		restoreDialogMethod("close", originalClose);
		vi.useRealTimers();
	});

	it("publishes nesting when integration placements are already loaded on open", async () => {
		const approve = vi.fn().mockResolvedValue(false);
		const { placement, proposal } = createNestedReview();

		renderPreview(
			<IntegrationPreview
				onAddMore={vi.fn()}
				onApprove={approve}
				onClose={vi.fn()}
				placementStructure={placement}
				proposedStructure={proposal}
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: "Approve & save" }));

		await waitFor(() => {
			expect(approve).toHaveBeenCalledWith(
				expect.objectContaining({
					placements: [
						{
							changeId: createExtractionItem().id + CHANGE_ID_OFFSET,
							parentExtractionItemId: null,
							parentId: null,
							position: FIRST_ITEM_INDEX,
						},
						{
							changeId: CHILD_ITEM_ID + CHANGE_ID_OFFSET,
							parentExtractionItemId: createExtractionItem().id,
							parentId: null,
							position: REMAINING_ITEM_COUNT,
						},
						{
							changeId: GRANDCHILD_ITEM_ID + CHANGE_ID_OFFSET,
							parentExtractionItemId: CHILD_ITEM_ID,
							parentId: null,
							position: INITIAL_ITEM_COUNT,
						},
					],
				}),
			);
		});
	});

	it("clears the incoming parent when a user moves a child to an existing page", async () => {
		const approve = vi.fn().mockResolvedValue(false);
		const { placement, proposal } = createNestedReview();

		renderPreview(
			<IntegrationPreview
				onAddMore={vi.fn()}
				onApprove={approve}
				onClose={vi.fn()}
				placementStructure={placement}
				placementTargets={[{ id: KB_PAGE_ID, title: "Requirements" }]}
				proposedStructure={proposal}
			/>,
		);
		fireEvent.click(
			screen.getByRole("button", { name: "More actions for Child section" }),
		);
		fireEvent.click(screen.getByRole("menuitem", { name: "Move to…" }));
		fireEvent.click(screen.getByRole("menuitem", { name: "Requirements" }));
		fireEvent.click(screen.getByRole("button", { name: "Approve & save" }));

		await waitFor(() => {
			expect(approve).toHaveBeenCalledWith(
				expect.objectContaining({
					placements: [
						{
							changeId: createExtractionItem().id + CHANGE_ID_OFFSET,
							parentExtractionItemId: null,
							parentId: null,
							position: FIRST_ITEM_INDEX,
						},
						{
							changeId: CHILD_ITEM_ID + CHANGE_ID_OFFSET,
							parentExtractionItemId: null,
							parentId: KB_PAGE_ID,
							position: REMAINING_ITEM_COUNT,
						},
						{
							changeId: GRANDCHILD_ITEM_ID + CHANGE_ID_OFFSET,
							parentExtractionItemId: CHILD_ITEM_ID,
							parentId: null,
							position: INITIAL_ITEM_COUNT,
						},
					],
				}),
			);
		});
	});

	it("publishes retained children after their parent is rejected in the review", async () => {
		const approve = vi.fn().mockResolvedValue(false);
		const { placement, proposal } = createNestedReview();
		renderPreview(
			<IntegrationPreview
				onAddMore={vi.fn()}
				onApprove={approve}
				onClose={vi.fn()}
				placementStructure={placement}
				proposedStructure={proposal}
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: "Reject item" }));
		fireEvent.click(screen.getByRole("button", { name: "Reject" }));
		fireEvent.click(screen.getByRole("button", { name: "Approve & save" }));

		await waitFor(() => {
			expect(approve).toHaveBeenCalledWith(
				expect.objectContaining({
					items: [
						expect.objectContaining({ id: CHILD_ITEM_ID }),
						expect.objectContaining({ id: GRANDCHILD_ITEM_ID }),
					],
					placements: [
						{
							changeId: CHILD_ITEM_ID + CHANGE_ID_OFFSET,
							parentExtractionItemId: null,
							parentId: null,
							position: FIRST_ITEM_INDEX,
						},
						{
							changeId: GRANDCHILD_ITEM_ID + CHANGE_ID_OFFSET,
							parentExtractionItemId: CHILD_ITEM_ID,
							parentId: null,
							position: REMAINING_ITEM_COUNT,
						},
					],
				}),
			);
		});
	});

	it("keeps late-arriving nesting when editing is cancelled", async () => {
		const approve = vi.fn().mockResolvedValue(false);
		const { placement, proposal } = createNestedReview();
		const onAddMore = vi.fn();
		const onClose = vi.fn();
		const view = renderPreview(
			<IntegrationPreview
				onAddMore={onAddMore}
				onApprove={approve}
				onClose={onClose}
				proposedStructure={proposal}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		fireEvent.change(screen.getByDisplayValue(createExtractionItem().title), {
			target: { value: "Unsaved parent title" },
		});

		view.rerender(
			<Provider store={store.instance}>
				<MemoryRouter>
					<IntegrationPreview
						onAddMore={onAddMore}
						onApprove={approve}
						onClose={onClose}
						placementStructure={placement}
						proposedStructure={proposal}
					/>
				</MemoryRouter>
			</Provider>,
		);
		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
		fireEvent.click(screen.getByRole("button", { name: "Approve & save" }));

		await waitFor(() => {
			expect(approve).toHaveBeenCalledWith(
				expect.objectContaining({
					contentOverrides: [
						{
							changeId: createExtractionItem().id + CHANGE_ID_OFFSET,
							content: createExtractionItem().text,
							title: createExtractionItem().title,
						},
						{
							changeId: CHILD_ITEM_ID + CHANGE_ID_OFFSET,
							content: createExtractionItem().text,
							title: "Child section",
						},
						{
							changeId: GRANDCHILD_ITEM_ID + CHANGE_ID_OFFSET,
							content: createExtractionItem().text,
							title: "Grandchild section",
						},
					],
					placements: [
						{
							changeId: createExtractionItem().id + CHANGE_ID_OFFSET,
							parentExtractionItemId: null,
							parentId: null,
							position: FIRST_ITEM_INDEX,
						},
						{
							changeId: CHILD_ITEM_ID + CHANGE_ID_OFFSET,
							parentExtractionItemId: createExtractionItem().id,
							parentId: null,
							position: REMAINING_ITEM_COUNT,
						},
						{
							changeId: GRANDCHILD_ITEM_ID + CHANGE_ID_OFFSET,
							parentExtractionItemId: CHILD_ITEM_ID,
							parentId: null,
							position: INITIAL_ITEM_COUNT,
						},
					],
				}),
			);
		});
	});

	it("shows each extraction item's source page and excerpt", () => {
		renderPreview(
			<IntegrationPreview
				onAddMore={vi.fn()}
				onApprove={vi.fn().mockResolvedValue(false)}
				onClose={vi.fn()}
				proposedStructure={mapExtractionItemsToProposedStructure([
					createExtractionItem(),
				])}
			/>,
		);

		expect(screen.getByText("Source page: 3")).toBeInTheDocument();
		expect(
			screen.getByText(
				"Source excerpt: KnowledgePrism keeps approved knowledge traceable.",
			),
		).toBeInTheDocument();
	});

	it("shows extracted section blocks in the review editor", () => {
		const item = {
			...createExtractionItem(),
			blocks: [
				{
					content: [{ text: "Overview", type: "text" as const }],
					props: { level: ExtractionHeadingLevel.SECTION },
					type: "heading" as const,
				},
				{
					content: [{ text: "The limit is 10.", type: "text" as const }],
					type: "paragraph" as const,
				},
				{
					content: [{ text: "Keep a backup.", type: "text" as const }],
					type: "bulletListItem" as const,
				},
				{
					content: [{ text: "Confirm the backup.", type: "text" as const }],
					props: { checked: false },
					type: "checkListItem" as const,
				},
				{
					content: [
						{
							styles: { bold: true as const },
							text: "Decision",
							type: "text" as const,
						},
						{ text: " Use Postgres.", type: "text" as const },
					],
					type: "paragraph" as const,
				},
			],
		};

		const structure = mapExtractionItemsToProposedStructure([item]);

		render(
			<IntegrationPreview
				onAddMore={vi.fn()}
				onApprove={vi.fn().mockResolvedValue(false)}
				onClose={vi.fn()}
				proposedStructure={structure}
			/>,
		);

		expect(screen.getByText("heading")).toBeInTheDocument();
		expect(screen.getByText("bulletListItem")).toBeInTheDocument();
		expect(screen.getByText("checkListItem")).toBeInTheDocument();
		expect(screen.getAllByText("paragraph")).toHaveLength(
			PARAGRAPH_BLOCK_COUNT,
		);
	});

	it("keeps empty extraction sections returned by the API", () => {
		const structure = mapExtractionItemsToProposedStructure(
			[],
			[
				{
					id: 41,
					position: 0,
					title: "Empty reviewed page",
				},
			],
		);

		expect(structure).toEqual([
			expect.objectContaining({
				id: "41",
				pages: [],
				title: "Empty reviewed page",
			}),
		]);
	});

	it("does not allow editing a synthetic source-page group title", () => {
		renderPreview(
			<IntegrationPreview
				onAddMore={vi.fn()}
				onApprove={vi.fn().mockResolvedValue(false)}
				onClose={vi.fn()}
				proposedStructure={mapExtractionItemsToProposedStructure([
					createExtractionItem(),
				])}
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
				onApprove={vi.fn().mockResolvedValue(false)}
				onClose={vi.fn()}
				proposedStructure={mapExtractionItemsToProposedStructure([
					createExtractionItem(),
				])}
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
				onApprove={approve}
				onClose={vi.fn()}
				proposedStructure={mapExtractionItemsToProposedStructure([
					createExtractionItem(),
				])}
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

	it("does not show incomplete-page warnings for a successful extraction", () => {
		render(
			<IntegrationPreview
				failedPageNumbers={[]}
				onAddMore={vi.fn()}
				onApprove={vi.fn()}
				onClose={vi.fn()}
				proposedStructure={mapExtractionItemsToProposedStructure([
					createExtractionItem(),
				])}
			/>,
		);
		expect(
			screen.queryByText("Some pages could not be processed"),
		).not.toBeInTheDocument();
	});

	it("warns about pages whose extraction failed", () => {
		render(
			<IntegrationPreview
				failedPageNumbers={[FAILED_PAGE_NUMBER]}
				onAddMore={vi.fn()}
				onApprove={vi.fn()}
				onClose={vi.fn()}
				proposedStructure={mapExtractionItemsToProposedStructure([
					createExtractionItem(),
				])}
			/>,
		);

		expect(
			screen.getByText("Some pages could not be processed"),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				"Page 4 could not be processed, so items from it may be missing.",
			),
		).toBeInTheDocument();
	});

	it("shows a document-scoped extraction review error", () => {
		renderPreview(
			<IntegrationPreview
				errorMessage="Extraction update failed"
				onAddMore={vi.fn()}
				onApprove={vi.fn()}
				onClose={vi.fn()}
				proposedStructure={mapExtractionItemsToProposedStructure([
					createExtractionItem(),
				])}
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

		fireEvent.click(
			screen.getByRole("button", { name: "Review sections first" }),
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

	it("keeps an accepted glossary suggestion on a conflict resolvable as incoming", async () => {
		const approve = vi.fn().mockResolvedValue(false);
		const match = {
			canonicalName: "API",
			explanation: "Spells out the canonical term instead of using it.",
			matchedTermId: 1,
			sourceExcerpt: "application programming interface",
			suggestedText: "API",
		};
		vi.mocked(useGlossaryConsistencyCheck).mockImplementation(
			({ content, onContentChange }) => ({
				glossaryMatches: content.includes(match.sourceExcerpt) ? [match] : [],
				isCheckingGlossary: false,
				onAcceptGlossarySuggestion: (acceptedMatch): void => {
					onContentChange(
						content.replace(
							acceptedMatch.sourceExcerpt,
							() => acceptedMatch.suggestedText,
						),
					);
				},
				onKeepGlossarySuggestion: vi.fn(),
			}),
		);
		const structure: ProposedSection[] = [
			{
				id: "section",
				pages: [
					{
						content: "Use the application programming interface.",
						id: "page",
						integrationChangeId: 9,
						matchedNodeId: 3,
						originalContent: "Live content",
						originalTitle: "Title",
						status: "conflict",
						title: "Title",
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

		fireEvent.click(
			screen.getByRole("button", { name: "Review sections first" }),
		);
		fireEvent.click(screen.getByRole("button", { name: "Accept" }));
		fireEvent.click(screen.getByRole("button", { name: "Approve & save" }));
		const [titleIncomingButton, contentIncomingButton] = screen.getAllByRole(
			"button",
			{ name: "Use Incoming Version" },
		);
		const [titleKeepButton] = screen.getAllByRole("button", {
			name: "Keep Live Version",
		});

		expect(titleIncomingButton).toHaveAttribute(
			"data-conflict-id",
			"conf-title-9",
		);
		fireEvent.click(titleKeepButton as HTMLElement);
		fireEvent.click(contentIncomingButton as HTMLElement);
		fireEvent.click(screen.getByRole("button", { name: "Publish resolution" }));

		await waitFor(() => {
			expect(approve).toHaveBeenCalledWith(
				expect.objectContaining({
					contentOverrides: [
						{ changeId: 9, content: "Use the API.", title: "Title" },
					],
					resolutions: [{ changeId: 9, content: "use-new", title: "keep" }],
				}),
			);
		});
	});

	it("sends the incoming text once when a duplicate is merged with Both", async () => {
		const approve = vi.fn().mockResolvedValue(false);
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
						status: "duplicate",
						title: "Incoming title",
						type: KnowledgeNodeType.PAGE,
						wordingMatches: [
							{
								content: "Live content",
								nodeId: 3,
								span: "Live content",
								title: "Live title",
							},
						],
					},
				],
				status: "duplicate",
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

		fireEvent.click(screen.getByRole("button", { name: "Both" }));
		fireEvent.click(screen.getByRole("button", { name: "Save decisions" }));
		fireEvent.click(screen.getByRole("button", { name: "Approve & save" }));

		await waitFor(() => {
			expect(approve).toHaveBeenCalledWith(
				expect.objectContaining({
					contentOverrides: [
						{
							changeId: 9,
							content: "Incoming content",
							title: "Incoming title",
						},
					],
					resolutions: [
						{ changeId: 9, content: "both", matchIndex: 0, title: "use-new" },
					],
				}),
			);
		});
	});

	it("asks for conflict decisions first and publishes them on approve", async () => {
		const approve = vi.fn().mockResolvedValue(false);
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
						status: "duplicate",
						title: "Incoming title",
						type: KnowledgeNodeType.PAGE,
					},
				],
				status: "duplicate",
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

		const [titleKeepButton] = screen.getAllByRole("button", {
			name: "Keep Live Version",
		});
		fireEvent.click(titleKeepButton as HTMLElement);
		fireEvent.click(screen.getByRole("button", { name: "Save decisions" }));

		expect(
			screen.getByRole("button", { name: "Change decisions" }),
		).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Approve & save" }));

		await waitFor(() => {
			expect(approve).toHaveBeenCalledWith(
				expect.objectContaining({
					resolutions: [{ changeId: 9, content: "use-new", title: "keep" }],
				}),
			);
		});
	});

	it("sends integration change ids when the placement is loaded before opening", async () => {
		const approve = vi.fn().mockResolvedValue(false);
		const item = createExtractionItem();
		const placementStructure = createPlacementStructure(item);
		renderPreview(
			<IntegrationPreview
				onAddMore={vi.fn()}
				onApprove={approve}
				onClose={vi.fn()}
				placementStructure={placementStructure}
				proposedStructure={mapExtractionItemsToProposedStructure([item])}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Approve & save" }));

		await waitFor(() => {
			expect(approve).toHaveBeenCalledWith(
				expect.objectContaining({
					contentOverrides: [
						{
							changeId: INTEGRATION_CHANGE_ID,
							content: item.text,
							title: item.title,
						},
					],
				}),
			);
		});
	});

	it("keeps integration change ids after cancelling an edit started before the placement loaded", async () => {
		const approve = vi.fn().mockResolvedValue(false);
		const item = createExtractionItem();
		const proposedStructure = mapExtractionItemsToProposedStructure([item]);
		const renderWithPlacement = (
			placementStructure?: ProposedSection[],
		): ReactElement => (
			<Provider store={store.instance}>
				<MemoryRouter>
					<IntegrationPreview
						onAddMore={vi.fn()}
						onApprove={approve}
						onClose={vi.fn()}
						{...(placementStructure && { placementStructure })}
						proposedStructure={proposedStructure}
					/>
				</MemoryRouter>
			</Provider>
		);
		const { rerender } = render(renderWithPlacement());

		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		rerender(renderWithPlacement(createPlacementStructure(item)));
		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
		fireEvent.click(screen.getByRole("button", { name: "Approve & save" }));

		await waitFor(() => {
			expect(approve).toHaveBeenCalledWith(
				expect.objectContaining({
					contentOverrides: [
						{
							changeId: INTEGRATION_CHANGE_ID,
							content: item.text,
							title: item.title,
						},
					],
				}),
			);
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
			screen.getByRole("button", { name: "Review extraction" }),
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
			screen.queryByRole("button", { name: "Review extraction" }),
		).not.toBeInTheDocument();
	});
});

describe("IntegrationPreview proposed structure editing", () => {
	it("deletes an item via its row delete button", () => {
		const structure = mapExtractionItemsToProposedStructure([
			createExtractionItem(),
			{ ...createExtractionItem(), id: 18, title: "Second traceability" },
		]);
		render(
			<IntegrationPreview
				onAddMore={vi.fn()}
				onApprove={vi.fn().mockResolvedValue(false)}
				onClose={vi.fn()}
				proposedStructure={structure}
			/>,
		);

		expect(
			screen.getAllByRole("button", { name: /^More actions for / }),
		).toHaveLength(INITIAL_ITEM_COUNT);

		const [firstMenuButton] = screen.getAllByRole("button", {
			name: /^More actions for /,
		});

		if (!firstMenuButton) {
			throw new Error("Expected an item menu to be rendered");
		}

		fireEvent.click(firstMenuButton);
		fireEvent.click(screen.getByRole("menuitem", { name: "Discard" }));

		expect(
			screen.getAllByRole("button", { name: /^More actions for / }),
		).toHaveLength(REMAINING_ITEM_COUNT);
	});

	it("offers no add controls on the placement review", () => {
		const structure: ProposedSection[] = [
			{
				id: "section",
				pages: [
					{
						content: "Incoming content",
						id: "page",
						integrationChangeId: 9,
						status: "created",
						title: "Incoming title",
						type: KnowledgeNodeType.PAGE,
					},
				],
				status: "created",
				title: "Section",
				type: KnowledgeNodeType.SECTION,
			},
		];
		render(
			<IntegrationPreview
				onAddMore={vi.fn()}
				onApprove={vi.fn()}
				onClose={vi.fn()}
				proposedStructure={structure}
			/>,
		);

		expect(
			screen.queryByRole("button", { name: "Add page" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Add item" }),
		).not.toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /^More actions for / }),
		).toBeInTheDocument();
	});

	it("moves an item under a chosen knowledge base page from its menu", async () => {
		const approve = vi.fn().mockResolvedValue(false);
		renderPreview(
			<IntegrationPreview
				onAddMore={vi.fn()}
				onApprove={approve}
				onClose={vi.fn()}
				placementTargets={[{ id: KB_PAGE_ID, title: "Requirements" }]}
				proposedStructure={mapExtractionItemsToProposedStructure([
					createExtractionItem(),
				])}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: /^More actions for / }));
		fireEvent.click(screen.getByRole("menuitem", { name: "Move to…" }));
		fireEvent.click(screen.getByRole("menuitem", { name: "Requirements" }));
		fireEvent.click(screen.getByRole("button", { name: "Approve & save" }));

		await waitFor(() => {
			expect(approve).toHaveBeenCalledWith(
				expect.objectContaining({
					placements: [expect.objectContaining({ parentId: KB_PAGE_ID })],
				}),
			);
		});
	});
});

const DISCARD_DIALOG_TITLE = "Discard this document?";

const closeTestDialogs = (): void => {
	for (const dialog of document.querySelectorAll("dialog")) {
		dialog.removeAttribute("open");
	}
};

const openTestDialog = (title: string): void => {
	for (const dialog of document.querySelectorAll("dialog")) {
		if (dialog.textContent.includes(title)) {
			dialog.setAttribute("open", "");
		}
	}
};

const openDiscardTestDialog = (): void => {
	openTestDialog(DISCARD_DIALOG_TITLE);
};

const restoreDialogMethod = (
	name: "close" | "showModal",
	descriptor: PropertyDescriptor | undefined,
): void => {
	if (descriptor) {
		Object.defineProperty(HTMLDialogElement.prototype, name, descriptor);

		return;
	}

	Reflect.deleteProperty(HTMLDialogElement.prototype, name);
};

describe("IntegrationPreview document discard", () => {
	const originalShowModal = Object.getOwnPropertyDescriptor(
		HTMLDialogElement.prototype,
		"showModal",
	);
	const originalClose = Object.getOwnPropertyDescriptor(
		HTMLDialogElement.prototype,
		"close",
	);

	afterEach(() => {
		restoreDialogMethod("showModal", originalShowModal);
		restoreDialogMethod("close", originalClose);
	});

	beforeEach(() => {
		HTMLDialogElement.prototype.showModal = openDiscardTestDialog;
		HTMLDialogElement.prototype.close = closeTestDialogs;
		store.instance.dispatch(actions.resetState(null));
		store.instance.dispatch(
			workspacesActions.setLastActiveProject(TEST_PROJECT_ID),
		);
	});

	it("confirms before discarding the document", () => {
		const onCancelDocument = vi.fn();
		renderPreview(
			<IntegrationPreview
				onAddMore={vi.fn()}
				onApprove={vi.fn().mockResolvedValue(false)}
				onCancelDocument={onCancelDocument}
				onClose={vi.fn()}
				proposedStructure={mapExtractionItemsToProposedStructure([
					createExtractionItem(),
				])}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Discard document" }));
		const dialog = screen.getByRole("dialog", {
			name: DISCARD_DIALOG_TITLE,
		});
		fireEvent.click(
			within(dialog).getByRole("button", { name: "Keep reviewing" }),
		);

		expect(onCancelDocument).not.toHaveBeenCalled();
		expect(
			screen.queryByRole("dialog", { name: DISCARD_DIALOG_TITLE }),
		).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Discard document" }));
		fireEvent.click(
			within(
				screen.getByRole("dialog", { name: DISCARD_DIALOG_TITLE }),
			).getByRole("button", { name: "Discard document" }),
		);

		expect(onCancelDocument).toHaveBeenCalledTimes(SINGLE_CALL_COUNT);
		expect(
			screen.queryByRole("dialog", { name: DISCARD_DIALOG_TITLE }),
		).not.toBeInTheDocument();
	});

	it("hides the discard action without a cancel handler", () => {
		renderPreview(
			<IntegrationPreview
				onAddMore={vi.fn()}
				onApprove={vi.fn().mockResolvedValue(false)}
				onClose={vi.fn()}
				proposedStructure={mapExtractionItemsToProposedStructure([
					createExtractionItem(),
				])}
			/>,
		);

		expect(
			screen.queryByRole("button", { name: "Discard document" }),
		).not.toBeInTheDocument();
	});
});

describe("IntegrationPreview focus mode", () => {
	const SECOND_ITEM_ID = 18;
	const THIRD_ITEM_ID = 19;

	const renderTwoItems = (): void => {
		const first = createExtractionItem();
		const second = {
			...first,
			id: SECOND_ITEM_ID,
			position: 1,
			title: "Second item",
		};
		const third = {
			...first,
			id: THIRD_ITEM_ID,
			position: 2,
			title: "Third item",
		};

		renderPreview(
			<IntegrationPreview
				onAddMore={vi.fn()}
				onApprove={vi.fn().mockResolvedValue(false)}
				onClose={vi.fn()}
				proposedStructure={mapExtractionItemsToProposedStructure([
					first,
					second,
					third,
				])}
			/>,
		);
	};

	it("shows the navigator with the section position when editing", () => {
		renderTwoItems();

		expect(screen.queryByText(/ \/ /u)).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Edit" }));

		expect(screen.getByText("1 / 3")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /Previous section/u }),
		).toBeDisabled();
	});

	it("moves to the next section and stays in edit mode", () => {
		renderTwoItems();

		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		fireEvent.click(screen.getByRole("button", { name: /Next section/u }));

		expect(screen.getByText("2 / 3")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
		expect(screen.getByDisplayValue("Second item")).toBeInTheDocument();
	});

	it("supports Alt+Arrow keys and disables Next on the last section", () => {
		renderTwoItems();

		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		fireEvent.keyDown(screen.getByDisplayValue("Source traceability"), {
			altKey: true,
			key: "ArrowDown",
		});
		fireEvent.keyDown(screen.getByDisplayValue("Second item"), {
			altKey: true,
			key: "ArrowDown",
		});

		expect(screen.getByText("3 / 3")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /Next section/u }),
		).toBeDisabled();

		fireEvent.keyDown(screen.getByDisplayValue("Third item"), {
			altKey: true,
			key: "ArrowUp",
		});

		expect(screen.getByText("2 / 3")).toBeInTheDocument();
	});

	it("keeps edits made before navigating", () => {
		renderTwoItems();

		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		fireEvent.change(screen.getByDisplayValue("Source traceability"), {
			target: { value: "Edited title" },
		});
		fireEvent.click(screen.getByRole("button", { name: /Next section/u }));
		fireEvent.click(screen.getByRole("button", { name: /Previous section/u }));

		expect(screen.getByDisplayValue("Edited title")).toBeInTheDocument();
	});

	it("leaves edit mode on Done and on Escape", () => {
		renderTwoItems();

		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		fireEvent.click(screen.getByRole("button", { name: "Done" }));

		expect(screen.queryByText("1 / 3")).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		fireEvent.keyDown(screen.getByDisplayValue("Source traceability"), {
			key: "Escape",
		});

		expect(screen.queryByText("1 / 3")).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
	});
});
