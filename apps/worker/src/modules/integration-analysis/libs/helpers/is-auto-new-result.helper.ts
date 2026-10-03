import { AUTO_NEW_EXPLANATION } from "../constants/auto-new-explanation.constant.js";
import { type IntegrationAnalysisResult } from "../types/integration-analysis-result.type.js";

const isAutoNewResult = <T>(result: IntegrationAnalysisResult<T>): boolean => {
	return result.explanation === AUTO_NEW_EXPLANATION && result.score === null;
};

export { isAutoNewResult };
