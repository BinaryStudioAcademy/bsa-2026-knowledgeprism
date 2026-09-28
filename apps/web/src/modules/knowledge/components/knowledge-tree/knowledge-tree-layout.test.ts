import { DocumentStatus } from "@knowledgeprism/constants";
import { describe, expect, it } from "vitest";

import { getPipelineVisibility } from "./knowledge-tree-layout.js";

describe("KnowledgeTreeLayout preview ownership", () => {
	it("does not reopen an old A preview after an A to B to A session change", () => {
		const visibility = getPipelineVisibility({
			activeDocumentId: 42,
			activeDocumentStatus: DocumentStatus.WAITING_FOR_APPROVAL,
			canEdit: true,
			extractionItemsDocumentId: null,
			isAddingKnowledge: false,
			pipelineProjectId: "a",
			pipelineSessionId: 3,
			previewSessionId: 1,
			projectId: "a",
			trackedDocuments: [
				{
					documentId: 42,
					label: "Document 42",
					status: DocumentStatus.WAITING_FOR_APPROVAL,
				},
			],
		});

		expect(visibility.isPreviewVisible).toBe(false);
	});
});
