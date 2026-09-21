import { type KnowledgeNodeContentDto } from "./knowledge-node-content-dto.type.js";

type KnowledgeEntryUpdateRequestDto = {
	contentJson: KnowledgeNodeContentDto;
	title: string;
};

export { type KnowledgeEntryUpdateRequestDto };
