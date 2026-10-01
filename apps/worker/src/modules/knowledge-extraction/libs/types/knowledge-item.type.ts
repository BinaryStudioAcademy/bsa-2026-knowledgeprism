import { type ExtractionContentBlock } from "@knowledgeprism/types";

type KnowledgeItem = {
	blocks: ExtractionContentBlock[];
	confidence: number;
	heading: string;
	isHeadingInherited?: boolean;
	position: number;
	rationale: string;
	sourceExcerpt: string;
	sourcePageNumber: number;
	text: string;
	title: string;
};

export { type KnowledgeItem };
