import { KnowledgeNodeType } from "@knowledgeprism/constants";
import { type KnowledgeTreeItemResponseDto } from "@knowledgeprism/types";
import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { store } from "~/lib/store/store.js";

import { type DocumentPlacement } from "../../libs/helpers/helpers.js";
import { useKnowledgeTreeDrag } from "./knowledge-tree-drag.js";
import { KnowledgeTreeItem } from "./knowledge-tree-item.js";

const FIRST_ID = 1;
const MIDDLE = 50;
const NEAR_BOTTOM = 90;
const NEAR_TOP = 5;
const POSITION_FIRST = 0;
const POSITION_SECOND = 1;
const ROW_HEIGHT = 100;
const SECOND_ID = 2;
const UPDATED_AT = "2026-09-29T00:00:00.000Z";

const first: KnowledgeTreeItemResponseDto = {
	id: FIRST_ID,
	parentId: null,
	position: POSITION_FIRST,
	title: "Guide",
	type: KnowledgeNodeType.PAGE,
	updatedAt: UPDATED_AT,
};

const second: KnowledgeTreeItemResponseDto = {
	id: SECOND_ID,
	parentId: null,
	position: POSITION_SECOND,
	title: "Notes",
	type: KnowledgeNodeType.PAGE,
	updatedAt: UPDATED_AT,
};

const items = [first, second];
const itemsByParentId = new Map<null | number, KnowledgeTreeItemResponseDto[]>([
	[null, items],
]);

type MoveHandler = (id: number, placement: DocumentPlacement) => void;

const Harness: React.FC<{ onMoveDocument: MoveHandler }> = ({
	onMoveDocument,
}: {
	onMoveDocument: MoveHandler;
}) => {
	const drag = useKnowledgeTreeDrag(items, onMoveDocument);

	return (
		<>
			{items.map((item) => (
				<KnowledgeTreeItem
					canStructure
					drag={drag}
					item={item}
					itemsByParentId={itemsByParentId}
					key={item.id}
					onCreateDocument={vi.fn()}
					onFocus={vi.fn()}
					onMoveDocument={onMoveDocument}
					onSelect={vi.fn()}
					treeItems={items}
				/>
			))}
		</>
	);
};

const fireDragEvent = (
	type: "dragOver" | "drop",
	row: HTMLElement,
	clientY: number,
): void => {
	const event = createEvent[type](row, { dataTransfer: {} });
	Object.defineProperty(event, "clientY", { value: clientY });
	fireEvent(row, event);
};

const getRow = (title: string): HTMLElement => {
	const row = screen.getByRole("treeitem", { name: title }).parentElement;

	if (!row) {
		throw new Error("Row not found");
	}

	row.getBoundingClientRect = (): DOMRect =>
		({ height: ROW_HEIGHT, top: POSITION_FIRST }) as DOMRect;

	return row;
};

const startDrag = (id: number): void => {
	fireEvent.dragStart(screen.getByTestId(`drag-grip-${String(id)}`), {
		dataTransfer: { setData: vi.fn() },
	});
};

const renderHarness = (onMoveDocument: MoveHandler): void => {
	render(
		<Provider store={store.instance}>
			<MemoryRouter initialEntries={["/workspaces/project-a/knowledge-tree"]}>
				<Routes>
					<Route
						element={<Harness onMoveDocument={onMoveDocument} />}
						path="/workspaces/:projectId/knowledge-tree"
					/>
				</Routes>
			</MemoryRouter>
		</Provider>,
	);
};

describe("knowledge tree drag and drop", () => {
	it("shows an insertion line and moves the dragged row on drop", () => {
		const onMoveDocument = vi.fn();
		renderHarness(onMoveDocument);

		startDrag(FIRST_ID);
		const target = getRow("Notes");
		fireDragEvent("dragOver", target, NEAR_BOTTOM);
		expect(screen.getByTestId("drop-indicator")).toHaveClass(
			"bottom-0",
			"h-0.5",
		);

		fireDragEvent("drop", target, NEAR_BOTTOM);
		expect(onMoveDocument).toHaveBeenCalledWith(FIRST_ID, {
			parentId: null,
			position: POSITION_SECOND,
		});
		expect(screen.queryByTestId("drop-indicator")).not.toBeInTheDocument();
	});

	it("nests the dragged row when dropped in the middle of another", () => {
		const onMoveDocument = vi.fn();
		renderHarness(onMoveDocument);

		startDrag(SECOND_ID);
		fireDragEvent("drop", getRow("Guide"), MIDDLE);

		expect(onMoveDocument).toHaveBeenCalledWith(SECOND_ID, {
			parentId: FIRST_ID,
			position: POSITION_FIRST,
		});
	});

	it("does nothing when the drop would not change the order", () => {
		const onMoveDocument = vi.fn();
		renderHarness(onMoveDocument);

		startDrag(FIRST_ID);
		const target = getRow("Notes");
		fireDragEvent("dragOver", target, NEAR_TOP);
		fireDragEvent("drop", target, NEAR_TOP);

		expect(screen.queryByTestId("drop-indicator")).not.toBeInTheDocument();
		expect(onMoveDocument).not.toHaveBeenCalled();
	});
});
