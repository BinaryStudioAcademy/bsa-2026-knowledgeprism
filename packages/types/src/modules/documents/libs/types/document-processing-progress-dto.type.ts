import { type DocumentProcessingPhase } from "@knowledgeprism/constants";

import { type ValueOf } from "../../../../libs/types/value-of.type.js";

type DocumentProcessingProgressDto = {
	failedUnits: number;
	phase: ValueOf<typeof DocumentProcessingPhase>;
	// Settled original units, including failures; retries do not increase the total.
	processedUnits: number;
	totalUnits: null | number;
};

export { type DocumentProcessingProgressDto };
