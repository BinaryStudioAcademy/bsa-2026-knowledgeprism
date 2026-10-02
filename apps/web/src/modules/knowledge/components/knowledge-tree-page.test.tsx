import { KnowledgeNodeType } from "@knowledgeprism/constants";
import {
	type KnowledgeEntryResponseDto,
	type KnowledgeTreeResponseDto,
} from "@knowledgeprism/types";
import { act, render, screen, waitFor } from "@testing-library/react";
import { type JSX, useCallback, useEffect } from "react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { store } from "~/lib/store/store.js";

import { knowledgeApi } from "../knowledge.js";
import { useProjectKnowledgePipeline } from "../libs/hooks/use-project-knowledge-pipeline.hook.js";
import { fetchKnowledgeTree, removeDocumentNode } from "../state/actions.js";
import { actions } from "../state/knowledge.slice.js";
import { KnowledgeTreePage } from "./knowledge-tree-page.js";

vi.mock("./knowledge-tree/knowledge-tree-layout.js", () => ({
	KnowledgeTreeLayout: ({
		entries,
		isSectionsLoading,
		isTreeReady,
		items,
		onSelectPage,
		selectedPageId,
	}: {
		entries: Record<number, { title: string }>;
		isSectionsLoading: boolean;
		isTreeReady: boolean;
		items: { title: string }[];
		onSelectPage: (id: number) => void;
		selectedPageId?: number;
	}): JSX.Element => {
		const handleSelectSecondPage = useCallback((): void => {
			onSelectPage(SECOND_PAGE_ID);
		}, [onSelectPage]);
		const handleSelectDocument = useCallback((): void => {
			onSelectPage(PROJECT_A_NODE_ID);
		}, [onSelectPage]);
		const selectedEntry =
			selectedPageId === undefined ? undefined : entries[selectedPageId];
		const treeTitles = items.map((item) => item.title);

		return (
			<>
				<div data-testid="sections-state">
					{isSectionsLoading ? "loading" : "ready"}
				</div>
				<div data-testid="tree-state">
					{isTreeReady ? "ready" : "loading"}:{treeTitles}
				</div>
				<button onClick={handleSelectDocument} type="button">
					Select Document
				</button>
				<button onClick={handleSelectSecondPage} type="button">
					Select B
				</button>
				<div data-testid="entry-count">{Object.keys(entries).length}</div>
				<div data-testid="selected-entry">
					{selectedPageId === undefined
						? "none"
						: (selectedEntry?.title ?? "loading")}
				</div>
			</>
		);
	},
}));

const PROJECT_A_NODE_ID = 1;
const PROJECT_B_NODE_ID = 2;
const FIRST_PAGE_ID = 10;
const SECOND_PAGE_ID = 20;
const PROJECT_ID = "a";
const LARGE_SECTION_COUNT = 200;
const SINGLE_REQUEST_COUNT = 1;
const FIRST_CALL_INDEX = 0;
const REFRESH_TREE_REQUEST_COUNT = 2;
const ENTRY_REQUEST_COUNT_AFTER_REFRESH = 3;
const RETAINED_PAGE_REQUEST_COUNT = 2;
const REMOVED_PAGE_REQUEST_COUNT = 1;

const createDeferred = (): PromiseWithResolvers<KnowledgeTreeResponseDto> =>
	Promise.withResolvers<KnowledgeTreeResponseDto>();

const createTree = (id: number, title: string): KnowledgeTreeResponseDto => ({
	items: [
		{
			id,
			parentId: null,
			position: 0,
			title,
			type: KnowledgeNodeType.SECTION,
			updatedAt: "2026-09-28T00:00:00.000Z",
		},
	],
});

const createSelectableTree = (
	hasSecondPage = true,
): KnowledgeTreeResponseDto => ({
	items: [
		{
			id: PROJECT_A_NODE_ID,
			parentId: null,
			position: 0,
			title: "Section",
			type: KnowledgeNodeType.SECTION,
			updatedAt: "2026-09-28T00:00:00.000Z",
		},
		{
			id: FIRST_PAGE_ID,
			parentId: PROJECT_A_NODE_ID,
			position: 0,
			title: "A",
			type: KnowledgeNodeType.PAGE,
			updatedAt: "2026-09-28T00:00:00.000Z",
		},
		...(hasSecondPage
			? [
					{
						id: SECOND_PAGE_ID,
						parentId: PROJECT_A_NODE_ID,
						position: 1,
						title: "B",
						type: KnowledgeNodeType.PAGE,
						updatedAt: "2026-09-28T00:00:00.000Z",
					},
				]
			: []),
	],
});

const createEntry = (id: number, title: string) => ({
	contentJson: [],
	createdAt: "2026-09-28T00:00:00.000Z",
	id,
	parentId: PROJECT_A_NODE_ID,
	position: 0,
	projectId: 1,
	title,
	type: KnowledgeNodeType.PAGE,
	updatedAt: "2026-09-28T00:00:00.000Z",
});

const ProjectRoute = ({
	nodeId,
	projectId,
}: {
	nodeId?: number;
	projectId: string;
}): JSX.Element => {
	const navigate = useNavigate();
	useProjectKnowledgePipeline({ canEdit: false, projectId });

	useEffect(() => {
		const query = nodeId === undefined ? "" : `?nodeId=${String(nodeId)}`;
		void navigate(`/workspaces/${projectId}/knowledge-tree${query}`);
	}, [navigate, nodeId, projectId]);

	return (
		<Routes>
			<Route
				element={<KnowledgeTreePage />}
				path="/workspaces/:projectId/knowledge-tree"
			/>
		</Routes>
	);
};

const createDocumentTree = (): KnowledgeTreeResponseDto => ({
	items: [
		{
			id: PROJECT_A_NODE_ID,
			parentId: null,
			position: 0,
			title: "Document",
			type: KnowledgeNodeType.PAGE,
			updatedAt: "2026-09-28T00:00:00.000Z",
		},
		...Array.from({ length: LARGE_SECTION_COUNT }, (_, index) => ({
			id: FIRST_PAGE_ID + index,
			parentId: PROJECT_A_NODE_ID,
			position: index,
			title: `Section ${String(FIRST_PAGE_ID + index)}`,
			type: KnowledgeNodeType.ENTRY,
			updatedAt: "2026-09-28T00:00:00.000Z",
		})),
	],
});

const createDocumentContent = (
	prefix = "Section",
): { items: KnowledgeEntryResponseDto[] } => ({
	items: createDocumentTree().items.map((item) => ({
		...createEntry(item.id, `${prefix} ${String(item.id)}`),
		parentId: item.parentId,
		type: item.type,
	})),
});

const renderProject = (): ReturnType<typeof render> =>
	render(
		<Provider store={store.instance}>
			<MemoryRouter
				initialEntries={[`/workspaces/${PROJECT_ID}/knowledge-tree`]}
			>
				<ProjectRoute nodeId={PROJECT_A_NODE_ID} projectId={PROJECT_ID} />
			</MemoryRouter>
		</Provider>,
	);

describe("KnowledgeTreePage project races", () => {
	beforeEach(() => {
		store.instance.dispatch(actions.resetState(null));
	});

	afterEach(() => {
		store.instance.dispatch(actions.resetState(null));
		vi.restoreAllMocks();
	});

	it("loads 200 sections once without a separate entry request", async () => {
		const document = Promise.withResolvers<{
			items: KnowledgeEntryResponseDto[];
		}>();
		vi.spyOn(knowledgeApi, "getKnowledgeTree").mockResolvedValue(
			createDocumentTree(),
		);
		const getEntry = vi
			.spyOn(knowledgeApi, "getKnowledgeEntry")
			.mockImplementation(({ entryId }) =>
				Promise.resolve(createEntry(entryId, `Section ${String(entryId)}`)),
			);
		const getDocument = vi
			.spyOn(knowledgeApi, "getDocumentSections")
			.mockReturnValue(document.promise);

		renderProject();
		await waitFor(() => {
			expect(getDocument).toHaveBeenCalledTimes(SINGLE_REQUEST_COUNT);
		});
		const signal =
			getDocument.mock.calls[FIRST_CALL_INDEX]?.[FIRST_CALL_INDEX].signal;
		act(() => {
			screen.getByRole("button", { name: "Select Document" }).click();
		});
		expect(signal?.aborted).toBe(false);
		expect(getDocument).toHaveBeenCalledTimes(SINGLE_REQUEST_COUNT);
		await act(async () => {
			document.resolve(createDocumentContent());
			await document.promise;
		});
		await waitFor(() => {
			expect(screen.getByTestId("selected-entry")).toHaveTextContent(
				`Section ${String(PROJECT_A_NODE_ID)}`,
			);
			expect(screen.getByTestId("sections-state")).toHaveTextContent("ready");
			expect(screen.getByTestId("entry-count")).toHaveTextContent(
				String(LARGE_SECTION_COUNT + SINGLE_REQUEST_COUNT),
			);
		});
		expect(getEntry).not.toHaveBeenCalled();
		expect(getDocument).toHaveBeenCalledTimes(SINGLE_REQUEST_COUNT);
		expect(getDocument).toHaveBeenCalledWith(
			expect.objectContaining({
				documentId: PROJECT_A_NODE_ID,
				projectId: PROJECT_ID,
			}),
		);
	});

	it("reloads document content once after a tree refresh", async () => {
		vi.spyOn(knowledgeApi, "getKnowledgeTree").mockResolvedValue(
			createDocumentTree(),
		);
		const getEntry = vi
			.spyOn(knowledgeApi, "getKnowledgeEntry")
			.mockImplementation(({ entryId }) =>
				Promise.resolve(createEntry(entryId, `Section ${String(entryId)}`)),
			);
		const getDocument = vi
			.spyOn(knowledgeApi, "getDocumentSections")
			.mockResolvedValueOnce(createDocumentContent())
			.mockResolvedValueOnce(createDocumentContent("Updated"));

		renderProject();
		await waitFor(() => {
			expect(screen.getByTestId("selected-entry")).toHaveTextContent(
				`Section ${String(PROJECT_A_NODE_ID)}`,
			);
		});
		act(() => {
			screen.getByRole("button", { name: "Select Document" }).click();
		});
		await waitFor(() => {
			expect(screen.getByTestId("selected-entry")).toHaveTextContent(
				`Section ${String(PROJECT_A_NODE_ID)}`,
			);
		});
		expect(getDocument).toHaveBeenCalledTimes(SINGLE_REQUEST_COUNT);
		await act(async () => {
			await store.instance.dispatch(
				fetchKnowledgeTree({ projectId: PROJECT_ID }),
			);
		});
		await waitFor(() => {
			expect(screen.getByTestId("selected-entry")).toHaveTextContent(
				`Updated ${String(PROJECT_A_NODE_ID)}`,
			);
		});
		expect(getDocument).toHaveBeenCalledTimes(REFRESH_TREE_REQUEST_COUNT);
		expect(getEntry).not.toHaveBeenCalled();
	});

	it("shows a bulk-read error and does not retry on reselecting the document", async () => {
		vi.spyOn(knowledgeApi, "getKnowledgeTree").mockResolvedValue(
			createDocumentTree(),
		);
		const getEntry = vi
			.spyOn(knowledgeApi, "getKnowledgeEntry")
			.mockImplementation(({ entryId }) =>
				Promise.resolve(createEntry(entryId, `Section ${String(entryId)}`)),
			);
		const getDocument = vi
			.spyOn(knowledgeApi, "getDocumentSections")
			.mockRejectedValue(new Error("Document unavailable"));

		renderProject();
		await waitFor(() => {
			expect(screen.getByTestId("sections-state")).toHaveTextContent("ready");
		});
		await waitFor(() => {
			expect(store.instance.getState().knowledge.knowledgeErrorMessage).toBe(
				"Document unavailable",
			);
		});
		act(() => {
			screen.getByRole("button", { name: "Select Document" }).click();
		});
		expect(getDocument).toHaveBeenCalledTimes(SINGLE_REQUEST_COUNT);
		expect(getEntry).not.toHaveBeenCalled();
		expect(store.instance.getState().knowledge.isEntryLoading).toBe(false);
	});

	it("clears cached content when a refreshed document cannot be loaded", async () => {
		vi.spyOn(knowledgeApi, "getKnowledgeTree").mockResolvedValue(
			createDocumentTree(),
		);
		vi.spyOn(knowledgeApi, "getKnowledgeEntry").mockImplementation(
			({ entryId }) =>
				Promise.resolve(createEntry(entryId, `Section ${String(entryId)}`)),
		);
		const getDocument = vi
			.spyOn(knowledgeApi, "getDocumentSections")
			.mockResolvedValueOnce(createDocumentContent())
			.mockRejectedValueOnce(new Error("Refresh unavailable"));

		renderProject();
		await waitFor(() => {
			expect(screen.getByTestId("selected-entry")).toHaveTextContent(
				`Section ${String(PROJECT_A_NODE_ID)}`,
			);
		});
		await act(async () => {
			await store.instance.dispatch(
				fetchKnowledgeTree({ projectId: PROJECT_ID }),
			);
		});
		await waitFor(() => {
			expect(store.instance.getState().knowledge.knowledgeErrorMessage).toBe(
				"Refresh unavailable",
			);
			expect(screen.getByTestId("entry-count")).toHaveTextContent(/^0$/u);
		});
		expect(getDocument).toHaveBeenCalledTimes(REFRESH_TREE_REQUEST_COUNT);
	});

	it("aborts an old project document request and ignores its late response", async () => {
		vi.spyOn(knowledgeApi, "getKnowledgeEntry").mockImplementation(
			({ entryId, projectId }) =>
				Promise.resolve(
					createEntry(
						entryId,
						`${projectId === PROJECT_ID ? "Project A" : "Project B"} ${String(entryId)}`,
					),
				),
		);
		const oldDocument = Promise.withResolvers<{
			items: KnowledgeEntryResponseDto[];
		}>();
		vi.spyOn(knowledgeApi, "getKnowledgeTree").mockResolvedValue(
			createDocumentTree(),
		);
		const getDocument = vi
			.spyOn(knowledgeApi, "getDocumentSections")
			.mockImplementation(({ projectId }) =>
				projectId === PROJECT_ID
					? oldDocument.promise
					: Promise.resolve(createDocumentContent("Project B")),
			);
		const view = renderProject();
		await waitFor(() => {
			expect(getDocument).toHaveBeenCalledTimes(SINGLE_REQUEST_COUNT);
		});
		const oldSignal =
			getDocument.mock.calls[FIRST_CALL_INDEX]?.[FIRST_CALL_INDEX].signal;
		view.rerender(
			<Provider store={store.instance}>
				<MemoryRouter
					initialEntries={[`/workspaces/${PROJECT_ID}/knowledge-tree`]}
				>
					<ProjectRoute nodeId={PROJECT_A_NODE_ID} projectId="b" />
				</MemoryRouter>
			</Provider>,
		);
		await waitFor(() => {
			expect(screen.getByTestId("selected-entry")).toHaveTextContent(
				`Project B ${String(PROJECT_A_NODE_ID)}`,
			);
		});
		expect(oldSignal?.aborted).toBe(true);
		await act(async () => {
			oldDocument.resolve(createDocumentContent("Project A"));
			await oldDocument.promise;
		});
		expect(screen.getByTestId("selected-entry")).toHaveTextContent(
			`Project B ${String(PROJECT_A_NODE_ID)}`,
		);
	});

	it("keeps fast project B ready after slow project A settles", async () => {
		const projectA = createDeferred();
		const projectB = createDeferred();
		const getTree = vi
			.spyOn(knowledgeApi, "getKnowledgeTree")
			.mockImplementation(({ projectId }) =>
				projectId === "a" ? projectA.promise : projectB.promise,
			);

		const view = render(
			<Provider store={store.instance}>
				<MemoryRouter initialEntries={["/workspaces/a/knowledge-tree"]}>
					<ProjectRoute projectId="a" />
				</MemoryRouter>
			</Provider>,
		);

		await waitFor(() => {
			expect(getTree).toHaveBeenCalledWith(
				expect.objectContaining({ projectId: "a" }),
			);
		});

		view.rerender(
			<Provider store={store.instance}>
				<MemoryRouter initialEntries={["/workspaces/a/knowledge-tree"]}>
					<ProjectRoute projectId="b" />
				</MemoryRouter>
			</Provider>,
		);
		await waitFor(() => {
			expect(getTree).toHaveBeenCalledWith(
				expect.objectContaining({ projectId: "b" }),
			);
		});

		await act(async () => {
			projectB.resolve(createTree(PROJECT_B_NODE_ID, "Project B"));
			await projectB.promise;
		});
		await waitFor(() => {
			expect(screen.getByTestId("tree-state")).toHaveTextContent(
				"ready:Project B",
			);
		});

		await act(async () => {
			projectA.resolve(createTree(PROJECT_A_NODE_ID, "Project A"));
			await projectA.promise;
		});

		expect(screen.getByTestId("tree-state")).toHaveTextContent(
			"ready:Project B",
		);
	});

	it("reloads a manually selected page after the tree refreshes", async () => {
		const refreshedTree = createDeferred();
		const getTree = vi
			.spyOn(knowledgeApi, "getKnowledgeTree")
			.mockResolvedValueOnce(createSelectableTree())
			.mockReturnValueOnce(refreshedTree.promise);
		const getEntry = vi
			.spyOn(knowledgeApi, "getKnowledgeEntry")
			.mockImplementation(({ entryId }) =>
				Promise.resolve(
					createEntry(
						entryId,
						entryId === SECOND_PAGE_ID ? "B entry" : "A entry",
					),
				),
			);

		render(
			<Provider store={store.instance}>
				<MemoryRouter
					initialEntries={[`/workspaces/${PROJECT_ID}/knowledge-tree`]}
				>
					<ProjectRoute projectId={PROJECT_ID} />
				</MemoryRouter>
			</Provider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("tree-state")).toHaveTextContent("ready");
		});
		act(() => {
			screen.getByRole("button", { name: "Select B" }).click();
		});
		await waitFor(() => {
			expect(screen.getByTestId("selected-entry")).toHaveTextContent("B entry");
		});

		await act(async () => {
			const refreshRequest = store.instance.dispatch(
				fetchKnowledgeTree({ projectId: PROJECT_ID }),
			);
			refreshedTree.resolve(createSelectableTree());
			await refreshRequest;
		});
		await waitFor(() => {
			expect(getTree).toHaveBeenCalledTimes(REFRESH_TREE_REQUEST_COUNT);
			expect(getEntry).toHaveBeenCalledTimes(ENTRY_REQUEST_COUNT_AFTER_REFRESH);
			expect(getEntry).toHaveBeenLastCalledWith(
				expect.objectContaining({
					entryId: SECOND_PAGE_ID,
					projectId: PROJECT_ID,
				}),
			);
			expect(screen.getByTestId("selected-entry")).toHaveTextContent("B entry");
		});
		expect(
			getEntry.mock.calls.filter(([{ entryId }]) => entryId === SECOND_PAGE_ID),
		).toHaveLength(RETAINED_PAGE_REQUEST_COUNT);
	});

	it("falls back when the manually selected page was removed by refresh", async () => {
		const refreshedTree = createDeferred();
		vi.spyOn(knowledgeApi, "getKnowledgeTree")
			.mockResolvedValueOnce(createSelectableTree())
			.mockReturnValueOnce(refreshedTree.promise);
		const getEntry = vi
			.spyOn(knowledgeApi, "getKnowledgeEntry")
			.mockImplementation(({ entryId }) =>
				Promise.resolve(
					createEntry(
						entryId,
						entryId === SECOND_PAGE_ID ? "B entry" : "A entry",
					),
				),
			);

		render(
			<Provider store={store.instance}>
				<MemoryRouter
					initialEntries={[`/workspaces/${PROJECT_ID}/knowledge-tree`]}
				>
					<ProjectRoute projectId={PROJECT_ID} />
				</MemoryRouter>
			</Provider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("tree-state")).toHaveTextContent("ready");
		});
		act(() => {
			screen.getByRole("button", { name: "Select B" }).click();
		});
		await waitFor(() => {
			expect(screen.getByTestId("selected-entry")).toHaveTextContent("B entry");
		});

		await act(async () => {
			const refreshRequest = store.instance.dispatch(
				fetchKnowledgeTree({ projectId: PROJECT_ID }),
			);
			refreshedTree.resolve(createSelectableTree(false));
			await refreshRequest;
		});

		await waitFor(() => {
			expect(getEntry).toHaveBeenCalledTimes(ENTRY_REQUEST_COUNT_AFTER_REFRESH);
			expect(getEntry).toHaveBeenLastCalledWith(
				expect.objectContaining({
					entryId: FIRST_PAGE_ID,
					projectId: PROJECT_ID,
				}),
			);
			expect(screen.getByTestId("selected-entry")).toHaveTextContent("A entry");
		});
		expect(
			getEntry.mock.calls.filter(([{ entryId }]) => entryId === SECOND_PAGE_ID),
		).toHaveLength(REMOVED_PAGE_REQUEST_COUNT);
	});

	it("shows an empty page after the open document is removed", async () => {
		const nestedChildId = 30;
		const treeWithNestedDocument: KnowledgeTreeResponseDto = {
			items: [
				...createSelectableTree().items,
				{
					id: nestedChildId,
					parentId: SECOND_PAGE_ID,
					position: 0,
					title: "Child",
					type: KnowledgeNodeType.PAGE,
					updatedAt: "2026-09-28T00:00:00.000Z",
				},
			],
		};
		const treeAfterRemove = createSelectableTree(false);
		vi.spyOn(knowledgeApi, "removeDocumentNode").mockResolvedValue();
		vi.spyOn(knowledgeApi, "getKnowledgeTree")
			.mockResolvedValueOnce(treeWithNestedDocument)
			.mockResolvedValueOnce(treeAfterRemove);
		vi.spyOn(knowledgeApi, "getKnowledgeEntry").mockImplementation(
			({ entryId }) =>
				Promise.resolve(
					createEntry(
						entryId,
						entryId === SECOND_PAGE_ID ? "B entry" : "A entry",
					),
				),
		);

		render(
			<Provider store={store.instance}>
				<MemoryRouter
					initialEntries={[`/workspaces/${PROJECT_ID}/knowledge-tree`]}
				>
					<ProjectRoute projectId={PROJECT_ID} />
				</MemoryRouter>
			</Provider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("tree-state")).toHaveTextContent("ready");
		});
		act(() => {
			screen.getByRole("button", { name: "Select B" }).click();
		});
		await waitFor(() => {
			expect(screen.getByTestId("selected-entry")).toHaveTextContent("B entry");
		});

		await act(async () => {
			await store.instance.dispatch(
				removeDocumentNode({
					documentId: SECOND_PAGE_ID,
					projectId: PROJECT_ID,
					queryNodeId: null,
				}),
			);
		});

		await waitFor(() => {
			const treeText = screen.getByTestId("tree-state").textContent;

			expect(screen.getByTestId("selected-entry")).toHaveTextContent("none");
			expect(treeText.startsWith("ready:")).toBe(true);
			expect(treeText).toContain("Section");
			expect(treeText).toContain("A");
			expect(treeText).not.toContain("Child");
			expect(treeText).not.toContain("B");
		});
	});
});
