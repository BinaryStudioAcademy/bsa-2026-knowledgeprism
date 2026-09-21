import React, { useState } from "react";

import {
	mockKnowledgeEntryCamera,
	mockKnowledgeEntryProcessor,
	mockKnowledgeTreeResponse,
} from "../libs/mock-knowledge-tree.js";
import { KnowledgeTreeLayout } from "./knowledge-tree/knowledge-tree-layout.js";

const mockEntries = {
	2: mockKnowledgeEntryCamera,
	3: mockKnowledgeEntryProcessor,
};

const KnowledgeTreePage: React.FC = () => {
	const [selectedPageId, setSelectedPageId] = useState<number | undefined>(
		() => {
			const firstPage = mockKnowledgeTreeResponse.items.find(
				(item) => item.type === "PAGE" || item.type === "ENTRY",
			);

			return firstPage?.id;
		},
	);

	return (
		<KnowledgeTreeLayout
			canEdit={true}
			entries={mockEntries}
			items={mockKnowledgeTreeResponse.items}
			onSelectPage={setSelectedPageId}
			selectedPageId={selectedPageId}
		/>
	);
};

export { KnowledgeTreePage };
