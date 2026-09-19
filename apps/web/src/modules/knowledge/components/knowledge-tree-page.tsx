import React from "react";

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
	return (
		<KnowledgeTreeLayout
			canEdit={true}
			entries={mockEntries}
			items={mockKnowledgeTreeResponse.items}
		/>
	);
};

export { KnowledgeTreePage };
