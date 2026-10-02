import { type ExtractionContentBlock } from "@knowledgeprism/types";

type NodeMergeParameters = {
	existingBlocks: ExtractionContentBlock[];
	incomingBlocks: ExtractionContentBlock[];
	title: string;
};

export { type NodeMergeParameters };
