import { KnowledgeNodeType } from "@knowledgeprism/constants";
import { type KnowledgeTreeItemResponseDto } from "@knowledgeprism/types";
import { describe, expect, it } from "vitest";

import { resolveApprovedDocumentView } from "./resolve-approved-document-view.helper.js";

const DOCUMENT_ID = 10;
const FIRST_SECTION_ID = 21;
const NESTED_PAGE_ID = 30;
const POSITION_FIRST = 0;
const POSITION_SECOND = 1;
const SECOND_SECTION_ID = 22;
const CHILD_SECTION_ID = 41;
const GRANDCHILD_SECTION_ID = 42;
const CHILD_DOCUMENT_ENTRY_ID = 43;
const UPDATED_AT = "2026-09-30T00:00:00.000Z";

const item = ({
	id,
	parentId,
	position,
	type,
}: {
	id: number;
	parentId: null | number;
	position: number;
	type: KnowledgeTreeItemResponseDto["type"];
}): KnowledgeTreeItemResponseDto => {
	return {
		id,
		parentId,
		position,
		title: `Node ${String(id)}`,
		type,
		updatedAt: UPDATED_AT,
	};
};

const approvedDocument = [
	item({
		id: DOCUMENT_ID,
		parentId: null,
		position: POSITION_FIRST,
		type: KnowledgeNodeType.PAGE,
	}),
	item({
		id: FIRST_SECTION_ID,
		parentId: DOCUMENT_ID,
		position: POSITION_FIRST,
		type: KnowledgeNodeType.ENTRY,
	}),
	item({
		id: SECOND_SECTION_ID,
		parentId: DOCUMENT_ID,
		position: POSITION_SECOND,
		type: KnowledgeNodeType.ENTRY,
	}),
	item({
		id: NESTED_PAGE_ID,
		parentId: DOCUMENT_ID,
		position: POSITION_SECOND,
		type: KnowledgeNodeType.PAGE,
	}),
];

describe("resolveApprovedDocumentView", () => {
	it("reads every nested entry before the next sibling and scrolls to a selected grandchild", () => {
		const nestedDocument = [
			item({
				id: GRANDCHILD_SECTION_ID,
				parentId: CHILD_SECTION_ID,
				position: POSITION_FIRST,
				type: KnowledgeNodeType.ENTRY,
			}),
			...approvedDocument,
			item({
				id: CHILD_SECTION_ID,
				parentId: FIRST_SECTION_ID,
				position: POSITION_FIRST,
				type: KnowledgeNodeType.ENTRY,
			}),
			item({
				id: CHILD_DOCUMENT_ENTRY_ID,
				parentId: NESTED_PAGE_ID,
				position: POSITION_FIRST,
				type: KnowledgeNodeType.ENTRY,
			}),
		];

		expect(
			resolveApprovedDocumentView(nestedDocument, GRANDCHILD_SECTION_ID),
		).toEqual({
			documentId: DOCUMENT_ID,
			scrollSectionId: GRANDCHILD_SECTION_ID,
			sectionIds: [
				FIRST_SECTION_ID,
				CHILD_SECTION_ID,
				GRANDCHILD_SECTION_ID,
				SECOND_SECTION_ID,
			],
		});
		expect(
			resolveApprovedDocumentView(nestedDocument, DOCUMENT_ID)?.sectionIds,
		).toEqual([
			FIRST_SECTION_ID,
			CHILD_SECTION_ID,
			GRANDCHILD_SECTION_ID,
			SECOND_SECTION_ID,
		]);
		expect(
			resolveApprovedDocumentView(nestedDocument, CHILD_DOCUMENT_ENTRY_ID),
		).toEqual({
			documentId: NESTED_PAGE_ID,
			scrollSectionId: CHILD_DOCUMENT_ENTRY_ID,
			sectionIds: [CHILD_DOCUMENT_ENTRY_ID],
		});
	});

	it("ignores orphaned entries and stops when an entry's ancestors form a cycle", () => {
		const invalidEntries = [
			item({
				id: CHILD_SECTION_ID,
				parentId: GRANDCHILD_SECTION_ID,
				position: POSITION_FIRST,
				type: KnowledgeNodeType.ENTRY,
			}),
			item({
				id: GRANDCHILD_SECTION_ID,
				parentId: CHILD_SECTION_ID,
				position: POSITION_FIRST,
				type: KnowledgeNodeType.ENTRY,
			}),
		];

		expect(
			resolveApprovedDocumentView(invalidEntries, CHILD_SECTION_ID),
		).toBeNull();
		expect(
			resolveApprovedDocumentView(
				invalidEntries.slice(POSITION_FIRST, POSITION_SECOND),
				CHILD_SECTION_ID,
			),
		).toBeNull();
	});

	it("scrolls a sidebar heading to that section of the parent document", () => {
		expect(
			resolveApprovedDocumentView(approvedDocument, SECOND_SECTION_ID),
		).toEqual({
			documentId: DOCUMENT_ID,
			scrollSectionId: SECOND_SECTION_ID,
			sectionIds: [FIRST_SECTION_ID, SECOND_SECTION_ID],
		});
	});

	it("opens the approved document at the top when the page itself is selected", () => {
		expect(resolveApprovedDocumentView(approvedDocument, DOCUMENT_ID)).toEqual({
			documentId: DOCUMENT_ID,
			scrollSectionId: undefined,
			sectionIds: [FIRST_SECTION_ID, SECOND_SECTION_ID],
		});
	});

	it("keeps a nested document on its own page", () => {
		expect(
			resolveApprovedDocumentView(approvedDocument, NESTED_PAGE_ID),
		).toBeNull();
	});
});
