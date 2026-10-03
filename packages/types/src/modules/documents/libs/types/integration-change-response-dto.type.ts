import { IntegrationChangeType } from "@knowledgeprism/constants";

import { type ValueOf } from "../../../../libs/types/value-of.type.js";
import { type DocumentPlacementDto } from "./document-placement-dto.type.js";
import { type ExtractionContentBlock } from "./extraction-content-block.type.js";

type IntegrationChangeResponseDto = {
	explanation: string;
	extractionItemId: number;
	id: number;
	incomingContent: string;
	incomingTitle: string;
	liveContent: null | string;
	liveTitle: null | string;
	matchedNodeId: null | number;
	mergedBlocks: ExtractionContentBlock[] | null;
	placement: DocumentPlacementDto;
	score: null | number;
	type: ValueOf<typeof IntegrationChangeType>;
};

export { type IntegrationChangeResponseDto };
