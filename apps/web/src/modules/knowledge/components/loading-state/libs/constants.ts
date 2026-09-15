import { DocumentStatus } from "@knowledgeprism/constants";

import { type ValueOf } from "~/lib/types/types.js";

// TODO: Delete these mock timer constants when backend is connected
const INITIAL_STATUS_INDEX = 0;
const MOCK_TIMER_DELAY_MS = 2000;
const STATUS_INDEX_INCREMENT = 1;

const STATUS_PROGRESSION: ValueOf<typeof DocumentStatus>[] = [
	DocumentStatus.UPLOADED,
	DocumentStatus.PROCESSING,
	DocumentStatus.PARSED,
	DocumentStatus.EXTRACTING,
	DocumentStatus.EXTRACTED,
];

const FULL_PERCENTAGE = 100;
const PERCENTAGE_OFFSET = 1;

export {
	FULL_PERCENTAGE,
	INITIAL_STATUS_INDEX,
	MOCK_TIMER_DELAY_MS,
	PERCENTAGE_OFFSET,
	STATUS_INDEX_INCREMENT,
	STATUS_PROGRESSION,
};
