import { type KnowledgeNodeType } from "@knowledgeprism/constants";

import { type ValueOf } from "../../../../libs/types/types.js";

type KnowledgeTreeItemResponseDto = {
	id: number;
	parentId: null | number;
	position: number;
	title: string;
	type: ValueOf<typeof KnowledgeNodeType>;
	updatedAt: string;
};

export { type KnowledgeTreeItemResponseDto };
