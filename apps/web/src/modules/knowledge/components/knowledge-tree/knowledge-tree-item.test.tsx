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
import { KnowledgeTreeItem } from "./knowledge-tree-item.js";

const CHILD_ID = 3;
const EXPECTED_SELECT_CALLS = 1;
const PARENT_ID = 1;
const POSITION_FIRST = 0;
const POSITION_SECOND = 1;
const PROJECT_ID = "project-a";
const SIBLING_ID = 2;
const UPDATED_AT = "2026-09-29T00:00:00.000Z";
const MENU_LABELS = [
	"Rename",
	"Add subpage",
	"Move to…",
	"Edit content",
	"Delete",
];

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

const itemsByParentId = new Map<null | number, KnowledgeTreeItemResponseDto[]>([
	[null, [parent, sibling]],
	[parent.id, [child]],
]);

const openTestDialog = (): void => {
	document.querySelector("dialog")?.setAttribute("open", "");
};

const closeTestDialog = (): void => {
	document.querySelector("dialog")?.removeAttribute("open");
};

const renderItem = (ui: JSX.Element): ReturnType<typeof render> => {
	return render(
		<Provider store={store.instance}>
			<MemoryRouter
				initialEntries={[`/workspaces/${PROJECT_ID}/knowledge-tree`]}
			>
				<Routes>
					<Route element={ui} path="/workspaces/:projectId/knowledge-tree" />
				</Routes>
			</MemoryRouter>
		</Provider>,
	);
};

type RenderOptions = {
	onCreateDocument?: () => void;
	onEditNode?: () => void;
	onMoveDocument?: () => void;
	onSelect?: () => void;
};

const renderGuide = ({
	onCreateDocument = vi.fn(),
	onEditNode = vi.fn(),
	onMoveDocument = vi.fn(),
	onSelect = vi.fn(),
}: RenderOptions = {}): void => {
	renderItem(
		<KnowledgeTreeItem
			canStructure
			item={parent}
			itemsByParentId={itemsByParentId}
			onCreateDocument={onCreateDocument}
			onEditNode={onEditNode}
			onFocus={vi.fn()}
			onMoveDocument={onMoveDocument}
			onSelect={onSelect}
			treeItems={items}
		/>,
	);
};

const openGuideMenu = (): void => {
	fireEvent.click(
		screen.getByRole("button", { name: "More actions for Guide" }),
	);
};

const stubDialog = (): void => {
	HTMLDialogElement.prototype.showModal = openTestDialog;
	HTMLDialogElement.prototype.close = closeTestDialog;
};

describe("KnowledgeTreeItem", () => {
	afterEach(() => {
		store.instance.dispatch(actions.resetState(null));
		vi.restoreAllMocks();
	});

	it("selects and collapses a parent document", () => {
		const onSelect = vi.fn();

		renderGuide({ onSelect });

		fireEvent.click(screen.getByRole("treeitem", { name: /Guide/u }));
		expect(onSelect).toHaveBeenCalledWith(parent.id);

		fireEvent.click(screen.getByRole("button", { name: "Collapse Guide" }));
		expect(onSelect).toHaveBeenCalledTimes(EXPECTED_SELECT_CALLS);
		expect(screen.queryByText("Intro")).not.toBeInTheDocument();
	});

	it("opens the actions menu and closes it with Escape", () => {
		renderGuide();

		expect(screen.queryByRole("menu")).not.toBeInTheDocument();
		openGuideMenu();

		expect(screen.getByRole("menu")).toBeInTheDocument();
		for (const label of MENU_LABELS) {
			expect(screen.getByRole("menuitem", { name: label })).toBeVisible();
		}

		fireEvent.keyDown(screen.getByRole("menuitem", { name: "Rename" }), {
			key: "Escape",
		});
		expect(screen.queryByRole("menu")).not.toBeInTheDocument();
	});

	it("hides all actions when the user cannot structure the tree", () => {
		renderItem(
			<KnowledgeTreeItem
				item={parent}
				itemsByParentId={itemsByParentId}
				onFocus={vi.fn()}
				onSelect={vi.fn()}
				treeItems={items}
			/>,
		);

		expect(
			screen.queryByRole("button", { name: "More actions for Guide" }),
		).not.toBeInTheDocument();
	});

	it("opens for editing, adds a subpage and moves the page", () => {
		stubDialog();
		const onCreateDocument = vi.fn();
		const onEditNode = vi.fn();
		const onMoveDocument = vi.fn();

		renderGuide({ onCreateDocument, onEditNode, onMoveDocument });

		openGuideMenu();
		fireEvent.click(screen.getByRole("menuitem", { name: "Edit content" }));
		expect(onEditNode).toHaveBeenCalledWith(parent.id);

		openGuideMenu();
		fireEvent.click(screen.getByRole("menuitem", { name: "Add subpage" }));
		fireEvent.change(screen.getByRole("textbox", { name: "Document title" }), {
			target: { value: "Details" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Add subpage" }));
		expect(onCreateDocument).toHaveBeenCalledWith("Details", parent.id);

		openGuideMenu();
		fireEvent.click(screen.getByRole("menuitem", { name: "Move to…" }));
		fireEvent.click(screen.getByRole("button", { name: "Notes" }));
		expect(onMoveDocument).toHaveBeenCalledWith(parent.id, {
			parentId: sibling.id,
			position: POSITION_FIRST,
		});
	});

	it("renames a document by saving its existing content under the new title", async () => {
		stubDialog();
		store.instance.dispatch(actions.resetState(PROJECT_ID));
		const contentJson = [{ type: "paragraph" }];
		const onSelect = vi.fn();
		const entry = {
			contentJson,
			createdAt: UPDATED_AT,
			id: parent.id,
			parentId: null,
			position: POSITION_FIRST,
			projectId: 1,
			title: parent.title,
			type: parent.type,
			updatedAt: UPDATED_AT,
		};
		vi.spyOn(knowledgeApi, "getKnowledgeEntry").mockResolvedValue(entry);
		const update = vi
			.spyOn(knowledgeApi, "updateKnowledgeEntry")
			.mockResolvedValue({ ...entry, title: "Handbook" });
		vi.spyOn(notificationService, "notify").mockImplementation(() => {
			return;
		});

		renderGuide({ onSelect });

		openGuideMenu();
		fireEvent.click(screen.getByRole("menuitem", { name: "Rename" }));
		fireEvent.change(screen.getByRole("textbox", { name: "Title" }), {
			target: { value: "  Handbook " },
		});
		fireEvent.click(screen.getByRole("button", { name: "Save" }));

		await waitFor(() => {
			expect(update).toHaveBeenCalledWith(
				expect.objectContaining({
					entryId: parent.id,
					payload: { contentJson, title: "Handbook" },
					projectId: PROJECT_ID,
				}),
			);
		});
		expect(onSelect).toHaveBeenCalledWith(parent.id);
	});

	it("asks before deleting and removes the document after confirming", async () => {
		stubDialog();
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

		renderGuide();

		openGuideMenu();
		fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
		expect(screen.getByText("Delete Guide?")).toBeVisible();
		expect(screen.getByText(/This can't be undone\./u)).toBeVisible();

		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(screen.queryByText("Delete Guide?")).not.toBeInTheDocument();
		expect(removeDocument).not.toHaveBeenCalled();

		openGuideMenu();
		fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
		fireEvent.click(screen.getByRole("button", { name: "Delete" }));

		await waitFor(() => {
			expect(removeDocument).toHaveBeenCalledWith(
				expect.objectContaining({
					documentId: PARENT_ID,
					projectId: PROJECT_ID,
				}),
			);
			expect(
				store.instance.getState().knowledge.tree.map((node) => node.id),
			).toEqual([SIBLING_ID]);
		});
	});
});
