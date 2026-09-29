import { ExtractionItemStatus } from "@knowledgeprism/constants";

import { type ValueOf } from "../../../../libs/types/value-of.type.js";

type ExtractionItemResponseDto = {
	confidence: number;
	extractionSectionId: null | number;
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
