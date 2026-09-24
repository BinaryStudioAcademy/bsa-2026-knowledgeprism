import { TimeMs } from "@knowledgeprism/constants";

const SWEEP_INTERVAL_MINUTES = 5;
const STALE_AFTER_MINUTES = 30;

const ProcessingSweep = {
	INTERVAL_MS: SWEEP_INTERVAL_MINUTES * TimeMs.MINUTE,
	STALE_AFTER_MS: STALE_AFTER_MINUTES * TimeMs.MINUTE,
} as const;

export { ProcessingSweep };
