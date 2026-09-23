import { AUTO_NEW_EXPLANATION } from "../constants/auto-new-explanation.constant.js";
import { IntegrationChangeType } from "../constants/integration-change-type.constant.js";
import { type IntegrationAnalysisResult } from "../types/integration-analysis-result.type.js";

const createAutoNewResult = <T>(): IntegrationAnalysisResult<T> => {
	return {
		explanation: AUTO_NEW_EXPLANATION,
		matchedItem: null,
		score: null,
		type: IntegrationChangeType.NEW,
	};
};

export { createAutoNewResult };
