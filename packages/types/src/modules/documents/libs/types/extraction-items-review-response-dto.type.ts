import { DocumentStatus } from "@knowledgeprism/constants";

import { type ValueOf } from "../../../../libs/types/value-of.type.js";

type ExtractionItemsReviewResponseDto = {
	documentId: number;
	pageNodeId: null | number;
	status: ValueOf<typeof DocumentStatus>;
};

export { type ExtractionItemsReviewResponseDto };
