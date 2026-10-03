import { setTimeout } from "node:timers/promises";

import { ExtractionRecovery } from "~/modules/knowledge-extraction/libs/constants/extraction-recovery.constant.js";
import { isTransientExtractionError } from "~/modules/knowledge-extraction/libs/helpers/is-transient-extraction-error.helper.js";

const FIRST_ATTEMPT = 1;

const withTransientRetries = async <T>(
	operation: () => Promise<T>,
	pause: (milliseconds: number) => Promise<void> = setTimeout,
): Promise<T> => {
	for (let attempt = FIRST_ATTEMPT; ; attempt++) {
		try {
			return await operation();
		} catch (error) {
			if (
				attempt >= ExtractionRecovery.MAXIMUM_ATTEMPTS ||
				!isTransientExtractionError(error)
			) {
				throw error;
			}

			await pause(ExtractionRecovery.RETRY_DELAY_MS * attempt);
		}
	}
};

export { withTransientRetries };
