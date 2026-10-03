import { type ExtractionContentBlock } from "@knowledgeprism/types";

type NodeMergeResult = {
	blocks: ExtractionContentBlock[] | null;
	coverage: null | number;
};

export { type NodeMergeResult };
