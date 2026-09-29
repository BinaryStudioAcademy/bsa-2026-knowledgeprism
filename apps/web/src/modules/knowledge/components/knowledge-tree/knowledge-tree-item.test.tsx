import { KnowledgeNodeType } from "@knowledgeprism/constants";
import { type KnowledgeTreeItemResponseDto } from "@knowledgeprism/types";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { KnowledgeTreeItem } from "./knowledge-tree-item.js";

const CHILD_ID = 3;
const EXPECTED_SELECT_CALLS = 1;
const PARENT_ID = 1;
const POSITION_FIRST = 0;
const POSITION_SECOND = 1;
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

const itemsByParentId = new Map<null | number, KnowledgeTreeItemResponseDto[]>([
	[null, [parent, sibling]],
	[parent.id, [child]],
]);

describe("KnowledgeTreeItem", () => {
	it("opens a parent document and moves it from the sidebar", () => {
		const onSelect = vi.fn();
		const onMoveDocument = vi.fn();
		const onCreateDocument = vi.fn();

		render(
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
});
