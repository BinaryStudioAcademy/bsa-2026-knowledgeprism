import { ExtractionItemStatus } from "@knowledgeprism/constants";

import { type ValueOf } from "../../../../libs/types/value-of.type.js";
import { type ExtractionContentBlock } from "./extraction-content-block.type.js";

type ExtractionItemResponseDto = {
	blocks?: ExtractionContentBlock[];
	confidence: number;
	extractionSectionId: null | number;
	heading: null | string;
	id: number;
	position: number;
	rationale: string;
	sectionPosition?: number;
	sectionTitle?: string;
	sourceExcerpt: string;
	sourcePageNumber: number;
	status: ValueOf<typeof ExtractionItemStatus>;
	text: string;
	title: string;
};

export { type ExtractionItemResponseDto };
