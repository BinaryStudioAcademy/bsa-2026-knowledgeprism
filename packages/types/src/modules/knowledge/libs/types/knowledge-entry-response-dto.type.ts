import { type KnowledgeNodeType } from "@knowledgeprism/constants";

import { type ValueOf } from "../../../../libs/types/types.js";
import { type KnowledgeNodeContentDto } from "./knowledge-node-content-dto.type.js";

type KnowledgeEntryResponseDto = {
	contentJson: KnowledgeNodeContentDto | null;
	createdAt: string;
	id: number;
	parentId: null | number;
	position: number;
	projectId: number;
	title: string;
	type: ValueOf<typeof KnowledgeNodeType>;
	updatedAt: string;
};

export { type KnowledgeEntryResponseDto };
