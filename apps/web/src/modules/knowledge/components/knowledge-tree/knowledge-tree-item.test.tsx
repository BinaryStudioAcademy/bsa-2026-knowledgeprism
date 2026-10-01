import { KnowledgeNodeType } from "@knowledgeprism/constants";
import { type KnowledgeTreeItemResponseDto } from "@knowledgeprism/types";
import { fireEvent, render, screen } from "@testing-library/react";
import { type JSX } from "react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { store } from "~/lib/store/store.js";

import { KnowledgeTreeItem } from "./knowledge-tree-item.js";

const CHILD_ID = 3;
const EXPECTED_SELECT_CALLS = 1;
const PARENT_ID = 1;
const POSITION_FIRST = 0;
const POSITION_SECOND = 1;
const SIBLING_ID = 2;
const SUBSECTION_ID = 4;
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

const PROJECT_ID = "project-a";
const items = [parent, sibling, child];

const itemsByParentId = new Map<null | number, KnowledgeTreeItemResponseDto[]>([
	[null, [parent, sibling]],
	[parent.id, [child]],
]);

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

describe("KnowledgeTreeItem", () => {
	it("opens a parent document and moves it from the sidebar", () => {
		const onSelect = vi.fn();
		const onMoveDocument = vi.fn();
		const onCreateDocument = vi.fn();

		renderItem(
			<KnowledgeTreeItem
				canStructure
				item={parent}
				itemsByParentId={itemsByParentId}
				onCreateDocument={onCreateDocument}
				onFocus={vi.fn()}
				onMoveDocument={onMoveDocument}
				onSelect={onSelect}
				selectedId={parent.id}
				treeItems={items}
			/>,
		);

		const guide = screen.getByRole("treeitem", { name: /Guide/u });
		fireEvent.click(guide);
		expect(onSelect).toHaveBeenCalledWith(parent.id);

		fireEvent.click(screen.getByRole("button", { name: "Collapse Guide" }));
		expect(onSelect).toHaveBeenCalledTimes(EXPECTED_SELECT_CALLS);

		fireEvent.click(screen.getByRole("button", { name: "Move down" }));
		expect(onMoveDocument).toHaveBeenCalledWith(parent.id, {
			parentId: null,
			position: POSITION_SECOND,
		});

		fireEvent.click(screen.getByRole("button", { name: "Add subdocument" }));
		fireEvent.change(screen.getByRole("textbox", { name: "Document title" }), {
			target: { value: "Details" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Add subdocument" }));
		expect(onCreateDocument).toHaveBeenCalledWith("Details", parent.id);
	});

	it("shows remove on a nested section and a sub-section", () => {
		const section: KnowledgeTreeItemResponseDto = {
			...child,
			type: KnowledgeNodeType.ENTRY,
		};
		const subsection: KnowledgeTreeItemResponseDto = {
			id: SUBSECTION_ID,
			parentId: section.id,
			position: POSITION_FIRST,
			title: "Detail",
			type: KnowledgeNodeType.ENTRY,
			updatedAt: UPDATED_AT,
		};
		const sectionItems = [parent, sibling, section, subsection];
		const sectionItemsByParentId = new Map<
			null | number,
			KnowledgeTreeItemResponseDto[]
		>([
			[null, [parent, sibling]],
			[parent.id, [section]],
			[section.id, [subsection]],
		]);

		renderItem(
			<KnowledgeTreeItem
				canStructure
				item={parent}
				itemsByParentId={sectionItemsByParentId}
				onCreateDocument={vi.fn()}
				onFocus={vi.fn()}
				onMoveDocument={vi.fn()}
				onSelect={vi.fn()}
				selectedId={subsection.id}
				treeItems={sectionItems}
			/>,
		);

		expect(
			screen.getByRole("button", { name: "Remove Detail" }),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Remove Guide" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Remove Notes" }),
		).not.toBeInTheDocument();
	});
});
