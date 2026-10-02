const LOADING_FINISH_DELAY_MS = 1000;

const ProgressCount = {
	EMPTY: 0,
	FULL_PERCENTAGE: 100,
	SINGLE: 1,
} as const;

const StatusChipTone = {
	ERROR: "error",
	NEUTRAL: "neutral",
	SUCCESS: "success",
} as const;

export { LOADING_FINISH_DELAY_MS, ProgressCount, StatusChipTone };
