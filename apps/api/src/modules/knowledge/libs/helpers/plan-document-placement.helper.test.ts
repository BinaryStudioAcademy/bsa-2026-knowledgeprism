import {
	KnowledgeNodeType,
	KnowledgeValidationMessage,
} from "@knowledgeprism/constants";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
	DocumentPlacementError,
	type PlacementNode,
	planDocumentCreate,
	planDocumentMove,
	planDocumentRemove,
} from "./plan-document-placement.helper.js";

const DETAILS_ID = 3;
const FACT_ID = 4;
const GUIDE_ID = 1;
const MISSING_PARENT_ID = 9;
const NESTED_ID = 5;
const NOTES_ID = 2;
const POSITION_FIRST = 0;
const POSITION_FOURTH = 4;
const POSITION_SECOND = 1;
const POSITION_THIRD = 2;
const ROOT_PARENT_ID = null;
const SPARSE_NEXT_POSITION = 5;

const node = ({
	id,
	parentId,
	position,
	type = KnowledgeNodeType.PAGE,
}: {
	id: number;
	parentId: null | number;
	position: number;
	type?: PlacementNode["type"];
}): PlacementNode => {
	return { id, parentId, position, type };
};

const expectPlacementError = (action: () => void, message: string): void => {
	assert.throws(action, (error: unknown) => {
		assert.ok(error instanceof DocumentPlacementError);
		assert.equal(error.message, message);

		return true;
	});
};

void describe("planDocumentCreate", () => {
	void it("appends a root document after the last sibling", () => {
		const placement = planDocumentCreate({
			nodes: [
				node({
					id: GUIDE_ID,
					parentId: ROOT_PARENT_ID,
					position: POSITION_FIRST,
				}),
				node({
					id: NOTES_ID,
					parentId: ROOT_PARENT_ID,
					position: POSITION_FOURTH,
					type: KnowledgeNodeType.SECTION,
				}),
			],
			parentId: ROOT_PARENT_ID,
		});

		assert.deepEqual(placement, {
			parentId: ROOT_PARENT_ID,
			position: SPARSE_NEXT_POSITION,
		});
	});

	void it("appends a subdocument under a document page", () => {
		const placement = planDocumentCreate({
			nodes: [
				node({
					id: GUIDE_ID,
					parentId: ROOT_PARENT_ID,
					position: POSITION_FIRST,
				}),
				node({
					id: FACT_ID,
					parentId: GUIDE_ID,
					position: POSITION_FIRST,
					type: KnowledgeNodeType.ENTRY,
				}),
			],
			parentId: GUIDE_ID,
		});

		assert.deepEqual(placement, {
			parentId: GUIDE_ID,
			position: POSITION_SECOND,
		});
	});

	void it("rejects a fourth level", () => {
		expectPlacementError(() => {
			planDocumentCreate({
				nodes: [
					node({
						id: GUIDE_ID,
						parentId: ROOT_PARENT_ID,
						position: POSITION_FIRST,
					}),
					node({
						id: NOTES_ID,
						parentId: GUIDE_ID,
						position: POSITION_FIRST,
					}),
					node({
						id: DETAILS_ID,
						parentId: NOTES_ID,
						position: POSITION_FIRST,
					}),
				],
				parentId: DETAILS_ID,
			});
		}, KnowledgeValidationMessage.DOCUMENT_DEPTH_EXCEEDED);
	});

	void it("rejects a fact entry as a parent", () => {
		expectPlacementError(() => {
			planDocumentCreate({
				nodes: [
					node({
						id: GUIDE_ID,
						parentId: ROOT_PARENT_ID,
						position: POSITION_FIRST,
					}),
					node({
						id: NOTES_ID,
						parentId: GUIDE_ID,
						position: POSITION_FIRST,
						type: KnowledgeNodeType.ENTRY,
					}),
				],
				parentId: NOTES_ID,
			});
		}, KnowledgeValidationMessage.DOCUMENT_PARENT_INVALID);
	});

	void it("rejects a missing parent", () => {
		expectPlacementError(() => {
			planDocumentCreate({ nodes: [], parentId: MISSING_PARENT_ID });
		}, KnowledgeValidationMessage.PARENT_NOT_FOUND);
	});
});

void describe("planDocumentMove", () => {
	void it("reorders a document and shifts sibling positions", () => {
		const updates = planDocumentMove({
			nodeId: GUIDE_ID,
			nodes: [
				node({
					id: GUIDE_ID,
					parentId: ROOT_PARENT_ID,
					position: POSITION_FIRST,
				}),
				node({
					id: NOTES_ID,
					parentId: ROOT_PARENT_ID,
					position: POSITION_SECOND,
				}),
				node({
					id: DETAILS_ID,
					parentId: ROOT_PARENT_ID,
					position: POSITION_THIRD,
				}),
			],
			parentId: ROOT_PARENT_ID,
			position: POSITION_THIRD,
		});

		assert.deepEqual(updates, [
			{
				id: NOTES_ID,
				parentId: ROOT_PARENT_ID,
				position: POSITION_FIRST,
			},
			{
				id: DETAILS_ID,
				parentId: ROOT_PARENT_ID,
				position: POSITION_SECOND,
			},
			{
				id: GUIDE_ID,
				parentId: ROOT_PARENT_ID,
				position: POSITION_THIRD,
			},
		]);
	});

	void it("moves a document under another document and closes the old gap", () => {
		const updates = planDocumentMove({
			nodeId: NOTES_ID,
			nodes: [
				node({
					id: GUIDE_ID,
					parentId: ROOT_PARENT_ID,
					position: POSITION_FIRST,
				}),
				node({
					id: NOTES_ID,
					parentId: ROOT_PARENT_ID,
					position: POSITION_SECOND,
				}),
				node({
					id: DETAILS_ID,
					parentId: ROOT_PARENT_ID,
					position: POSITION_THIRD,
				}),
				node({
					id: FACT_ID,
					parentId: GUIDE_ID,
					position: POSITION_FIRST,
					type: KnowledgeNodeType.ENTRY,
				}),
			],
			parentId: GUIDE_ID,
			position: POSITION_SECOND,
		});

		assert.deepEqual(updates, [
			{ id: NOTES_ID, parentId: GUIDE_ID, position: POSITION_SECOND },
			{
				id: DETAILS_ID,
				parentId: ROOT_PARENT_ID,
				position: POSITION_SECOND,
			},
		]);
	});

	void it("rejects moving a fact entry", () => {
		expectPlacementError(() => {
			planDocumentMove({
				nodeId: NOTES_ID,
				nodes: [
					node({
						id: GUIDE_ID,
						parentId: ROOT_PARENT_ID,
						position: POSITION_FIRST,
					}),
					node({
						id: NOTES_ID,
						parentId: GUIDE_ID,
						position: POSITION_FIRST,
						type: KnowledgeNodeType.ENTRY,
					}),
				],
				parentId: ROOT_PARENT_ID,
				position: POSITION_SECOND,
			});
		}, KnowledgeValidationMessage.DOCUMENT_MOVE_INVALID);
	});

	void it("rejects a move under the document's own child", () => {
		expectPlacementError(() => {
			planDocumentMove({
				nodeId: GUIDE_ID,
				nodes: [
					node({
						id: GUIDE_ID,
						parentId: ROOT_PARENT_ID,
						position: POSITION_FIRST,
					}),
					node({
						id: NOTES_ID,
						parentId: GUIDE_ID,
						position: POSITION_FIRST,
					}),
				],
				parentId: NOTES_ID,
				position: POSITION_FIRST,
			});
		}, KnowledgeValidationMessage.DOCUMENT_CYCLE);
	});

	void it("rejects a move that would pass three levels", () => {
		expectPlacementError(() => {
			planDocumentMove({
				nodeId: NOTES_ID,
				nodes: [
					node({
						id: GUIDE_ID,
						parentId: ROOT_PARENT_ID,
						position: POSITION_FIRST,
					}),
					node({
						id: NOTES_ID,
						parentId: ROOT_PARENT_ID,
						position: POSITION_SECOND,
					}),
					node({
						id: DETAILS_ID,
						parentId: NOTES_ID,
						position: POSITION_FIRST,
					}),
					node({
						id: FACT_ID,
						parentId: GUIDE_ID,
						position: POSITION_FIRST,
					}),
					node({
						id: NESTED_ID,
						parentId: FACT_ID,
						position: POSITION_FIRST,
					}),
				],
				parentId: NESTED_ID,
				position: POSITION_FIRST,
			});
		}, KnowledgeValidationMessage.DOCUMENT_DEPTH_EXCEEDED);
	});

	void it("allows a document with a child to sit one level down", () => {
		const updates = planDocumentMove({
			nodeId: NOTES_ID,
			nodes: [
				node({
					id: GUIDE_ID,
					parentId: ROOT_PARENT_ID,
					position: POSITION_FIRST,
				}),
				node({
					id: NOTES_ID,
					parentId: ROOT_PARENT_ID,
					position: POSITION_SECOND,
				}),
				node({
					id: DETAILS_ID,
					parentId: NOTES_ID,
					position: POSITION_FIRST,
				}),
			],
			parentId: GUIDE_ID,
			position: POSITION_FIRST,
		});

		assert.deepEqual(
			updates.find((update) => update.id === NOTES_ID),
			{
				id: NOTES_ID,
				parentId: GUIDE_ID,
				position: POSITION_FIRST,
			},
		);
	});
});

void describe("planDocumentRemove", () => {
	void it("removes a document and its nested documents, leaving siblings out", () => {
		const removedIds = planDocumentRemove({
			nodeId: GUIDE_ID,
			nodes: [
				node({
					id: GUIDE_ID,
					parentId: ROOT_PARENT_ID,
					position: POSITION_FIRST,
				}),
				node({
					id: NOTES_ID,
					parentId: ROOT_PARENT_ID,
					position: POSITION_SECOND,
					type: KnowledgeNodeType.SECTION,
				}),
				node({
					id: DETAILS_ID,
					parentId: GUIDE_ID,
					position: POSITION_FIRST,
				}),
				node({
					id: FACT_ID,
					parentId: GUIDE_ID,
					position: POSITION_SECOND,
					type: KnowledgeNodeType.ENTRY,
				}),
				node({
					id: NESTED_ID,
					parentId: NOTES_ID,
					position: POSITION_FIRST,
				}),
			],
		});

		assert.deepEqual(removedIds, [DETAILS_ID, FACT_ID, GUIDE_ID]);
	});

	void it("rejects a missing document", () => {
		expectPlacementError(() => {
			planDocumentRemove({
				nodeId: MISSING_PARENT_ID,
				nodes: [
					node({
						id: GUIDE_ID,
						parentId: ROOT_PARENT_ID,
						position: POSITION_FIRST,
					}),
				],
			});
		}, KnowledgeValidationMessage.NOT_FOUND);
	});

	void it("removes a nested section and its children, leaving siblings", () => {
		const removedIds = planDocumentRemove({
			nodeId: FACT_ID,
			nodes: [
				node({
					id: GUIDE_ID,
					parentId: ROOT_PARENT_ID,
					position: POSITION_FIRST,
				}),
				node({
					id: NOTES_ID,
					parentId: ROOT_PARENT_ID,
					position: POSITION_SECOND,
				}),
				node({
					id: FACT_ID,
					parentId: GUIDE_ID,
					position: POSITION_FIRST,
					type: KnowledgeNodeType.ENTRY,
				}),
				node({
					id: NESTED_ID,
					parentId: FACT_ID,
					position: POSITION_FIRST,
				}),
				node({
					id: DETAILS_ID,
					parentId: GUIDE_ID,
					position: POSITION_SECOND,
				}),
			],
		});

		assert.deepEqual(removedIds, [NESTED_ID, FACT_ID]);
	});
});
