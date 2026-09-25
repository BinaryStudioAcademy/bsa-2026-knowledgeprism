import { IntegrationChangeType } from "@knowledgeprism/constants";

import { type ValueOf } from "../../../../libs/types/value-of.type.js";

type IntegrationChangeResponseDto = {
	explanation: string;
	extractionItemId: number;
	id: number;
	incomingContent: string;
	incomingTitle: string;
	liveContent: null | string;
	liveTitle: null | string;
	matchedNodeId: null | number;
	score: null | number;
	type: ValueOf<typeof IntegrationChangeType>;
};

export { type IntegrationChangeResponseDto };
