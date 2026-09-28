import { KnowledgeNodeType } from "@knowledgeprism/constants";
import { type KnowledgeTreeResponseDto } from "@knowledgeprism/types";
import { act, render, screen, waitFor } from "@testing-library/react";
import { type JSX, useEffect } from "react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { store } from "~/lib/store/store.js";

import { knowledgeApi } from "../knowledge.js";
import { actions } from "../state/knowledge.slice.js";
import { KnowledgeTreePage } from "./knowledge-tree-page.js";

vi.mock("./knowledge-tree/knowledge-tree-layout.js", () => ({
	KnowledgeTreeLayout: ({
		isTreeReady,
		items,
	}: {
		isTreeReady: boolean;
		items: { title: string }[];
	}): JSX.Element => (
		<div data-testid="tree-state">
			{isTreeReady ? "ready" : "loading"}:{items.map((item) => item.title)}
		</div>
	),
}));

const PROJECT_A_NODE_ID = 1;
const PROJECT_B_NODE_ID = 2;

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

const ProjectRoute = ({ projectId }: { projectId: string }): JSX.Element => {
	const navigate = useNavigate();

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
			expect(getTree).toHaveBeenCalledWith({ projectId: "a" });
		});

		view.rerender(
			<Provider store={store.instance}>
				<MemoryRouter initialEntries={["/workspaces/a/knowledge-tree"]}>
					<ProjectRoute projectId="b" />
				</MemoryRouter>
			</Provider>,
		);
		await waitFor(() => {
			expect(getTree).toHaveBeenCalledWith({ projectId: "b" });
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
});
