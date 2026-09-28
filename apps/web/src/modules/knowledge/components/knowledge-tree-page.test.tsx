import { KnowledgeNodeType } from "@knowledgeprism/constants";
import { type KnowledgeTreeResponseDto } from "@knowledgeprism/types";
import { act, render, screen, waitFor } from "@testing-library/react";
import { type JSX, useCallback, useEffect } from "react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { store } from "~/lib/store/store.js";

import { knowledgeApi } from "../knowledge.js";
import { useProjectKnowledgePipeline } from "../libs/hooks/use-project-knowledge-pipeline.hook.js";
import { fetchKnowledgeTree } from "../state/actions.js";
import { actions } from "../state/knowledge.slice.js";
import { KnowledgeTreePage } from "./knowledge-tree-page.js";

vi.mock("./knowledge-tree/knowledge-tree-layout.js", () => ({
	KnowledgeTreeLayout: ({
		entries,
		isTreeReady,
		items,
		onSelectPage,
		selectedPageId,
	}: {
		entries: Record<number, { title: string }>;
		isTreeReady: boolean;
		items: { title: string }[];
		onSelectPage: (id: number) => void;
		selectedPageId?: number;
	}): JSX.Element => {
		const handleSelectSecondPage = useCallback((): void => {
			onSelectPage(SECOND_PAGE_ID);
		}, [onSelectPage]);
		const selectedEntry =
			selectedPageId === undefined ? undefined : entries[selectedPageId];
		const treeTitles = items.map((item) => item.title);

		return (
			<>
				<div data-testid="tree-state">
					{isTreeReady ? "ready" : "loading"}:{treeTitles}
				</div>
				<button onClick={handleSelectSecondPage} type="button">
					Select B
				</button>
				<div data-testid="selected-entry">
					{selectedEntry?.title ?? "loading"}
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

const ProjectRoute = ({ projectId }: { projectId: string }): JSX.Element => {
	const navigate = useNavigate();
	useProjectKnowledgePipeline({ canEdit: false, projectId });

	useEffect(() => {
		void navigate(`/workspaces/${projectId}/knowledge-tree`);
	}, [navigate, projectId]);

	return (
		<Routes>
			<Route
				element={<KnowledgeTreePage />}
				path="/workspaces/:projectId/knowledge-tree"
			/>
		</Routes>
	);
};

describe("KnowledgeTreePage project races", () => {
	beforeEach(() => {
		store.instance.dispatch(actions.resetState(null));
	});

	afterEach(() => {
		store.instance.dispatch(actions.resetState(null));
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
});
