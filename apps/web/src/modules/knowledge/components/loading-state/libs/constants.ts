import { DocumentStatus } from "@knowledgeprism/constants";

import { type ValueOf } from "~/lib/types/types.js";

const STATUS_PROGRESSION: ValueOf<typeof DocumentStatus>[] = [
	DocumentStatus.UPLOADED,
	DocumentStatus.PROCESSING,
	DocumentStatus.PARSED,
	DocumentStatus.EXTRACTING,
	DocumentStatus.EXTRACTED,
	DocumentStatus.WAITING_FOR_APPROVAL,
];

const FULL_PERCENTAGE = 100;
const PERCENTAGE_OFFSET = 1;
const LOADING_FINISH_DELAY_MS = 1000;

export {
	FULL_PERCENTAGE,
	LOADING_FINISH_DELAY_MS,
	PERCENTAGE_OFFSET,
	STATUS_PROGRESSION,
};
