import { type KnowledgeItem } from "./knowledge-item.type.js";

type ExtractionResult = {
	failedPageNumbers: number[];
	items: KnowledgeItem[];
};

export { type ExtractionResult };
