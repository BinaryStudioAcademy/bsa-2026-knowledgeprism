import { IntegrationResolution } from "@knowledgeprism/constants";

import { type ValueOf } from "../../../../libs/types/value-of.type.js";

type IntegrationConflictResolutionDto = {
	changeId: number;
	content: ValueOf<typeof IntegrationResolution>;
	title: ValueOf<typeof IntegrationResolution>;
};

export { type IntegrationConflictResolutionDto };
