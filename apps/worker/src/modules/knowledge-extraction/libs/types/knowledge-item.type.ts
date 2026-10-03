import { type ExtractionContentBlock } from "@knowledgeprism/types";

type KnowledgeItem = {
	blocks: ExtractionContentBlock[];
	chunkIndex?: number;
	confidence: number;
	heading: string;
	isHeadingInherited?: boolean;
	position: number;
	rationale: string;
	sectionIndex?: null | number;
	sectionTitle?: null | string;
	sourceExcerpt: string;
	sourcePageNumber: number;
	text: string;
	title: string;
};

export { type KnowledgeItem };
