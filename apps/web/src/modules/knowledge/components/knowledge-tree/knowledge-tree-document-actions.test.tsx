import { KnowledgeNodeType } from "@knowledgeprism/constants";
import { type KnowledgeTreeItemResponseDto } from "@knowledgeprism/types";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { type JSX } from "react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { notificationService } from "~/lib/notifications/notification.service.js";
import { store } from "~/lib/store/store.js";

import { knowledgeApi } from "../../knowledge.js";
import { actions } from "../../state/state.js";
import { KnowledgeTreeDocumentActions } from "./knowledge-tree-document-actions.js";

const CHILD_ID = 3;
const PARENT_ID = 1;
const POSITION_FIRST = 0;
const POSITION_SECOND = 1;
const PROJECT_ID = "project-a";
const SIBLING_ID = 2;
const UPDATED_AT = "2026-09-29T00:00:00.000Z";

const parent: KnowledgeTreeItemResponseDto = {
	id: PARENT_ID,
	parentId: null,
	position: POSITION_FIRST,
	title: "Guide",
	type: KnowledgeNodeType.PAGE,
	updatedAt: UPDATED_AT,
};

const sibling: KnowledgeTreeItemResponseDto = {
	id: SIBLING_ID,
	parentId: null,
	position: POSITION_SECOND,
	title: "Notes",
	type: KnowledgeNodeType.PAGE,
	updatedAt: UPDATED_AT,
};

const child: KnowledgeTreeItemResponseDto = {
	id: CHILD_ID,
	parentId: PARENT_ID,
	position: POSITION_FIRST,
	title: "Intro",
	type: KnowledgeNodeType.PAGE,
	updatedAt: UPDATED_AT,
};

const items = [parent, sibling, child];

const openTestDialog = (): void => {
	document.querySelector("dialog")?.setAttribute("open", "");
};

const closeTestDialog = (): void => {
	document.querySelector("dialog")?.removeAttribute("open");
};

const renderActions = (): void => {
	const view: JSX.Element = (
		<KnowledgeTreeDocumentActions
			isPending={false}
			itemId={parent.id}
			items={items}
			onCreateDocument={vi.fn()}
			onMoveDocument={vi.fn()}
		/>
	);

	render(
		<Provider store={store.instance}>
			<MemoryRouter
				initialEntries={[`/workspaces/${PROJECT_ID}/knowledge-tree`]}
			>
				<Routes>
					<Route element={view} path="/workspaces/:projectId/knowledge-tree" />
				</Routes>
			</MemoryRouter>
		</Provider>,
	);
};

describe("KnowledgeTreeDocumentActions", () => {
	afterEach(() => {
		store.instance.dispatch(actions.resetState(null));
		vi.restoreAllMocks();
	});

	it("asks before removing a document and keeps its siblings", async () => {
		HTMLDialogElement.prototype.showModal = openTestDialog;
		HTMLDialogElement.prototype.close = closeTestDialog;
		store.instance.dispatch(actions.resetState(PROJECT_ID));
		const removeDocument = vi
			.spyOn(knowledgeApi, "removeDocumentNode")
			.mockResolvedValue();
		vi.spyOn(knowledgeApi, "getKnowledgeTree").mockResolvedValue({
			items: [sibling],
		});
		vi.spyOn(notificationService, "notify").mockImplementation(() => {
			return;
		});

		renderActions();

		fireEvent.click(screen.getByRole("button", { name: "Remove Guide" }));
		expect(
			screen.getByText(
				"“Guide” and the documents nested under it will be removed.",
			),
		).toBeVisible();

		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(
			screen.queryByText(
				"“Guide” and the documents nested under it will be removed.",
			),
		).not.toBeInTheDocument();
		expect(removeDocument).not.toHaveBeenCalled();

		fireEvent.click(screen.getByRole("button", { name: "Remove Guide" }));
		fireEvent.click(screen.getByRole("button", { name: "Remove" }));

		await waitFor(() => {
			expect(removeDocument).toHaveBeenCalledWith(
				expect.objectContaining({
					documentId: PARENT_ID,
					projectId: PROJECT_ID,
				}),
			);
			expect(
				store.instance.getState().knowledge.tree.map((item) => item.id),
			).toEqual([SIBLING_ID]);
			expect(store.instance.getState().knowledge.removedOpenDocument).toEqual({
				projectId: PROJECT_ID,
				queryNodeId: null,
			});
		});
	});
});
