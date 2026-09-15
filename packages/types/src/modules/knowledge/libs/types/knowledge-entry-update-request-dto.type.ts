import { type KnowledgeNodeContentDto } from "./knowledge-node-content-dto.type.js";

type KnowledgeEntryUpdateRequestDto = {
	contentJson: KnowledgeNodeContentDto | null;
	title: string;
};

export { type KnowledgeEntryUpdateRequestDto };
