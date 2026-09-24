import { type IntegrationChangeTypeValue } from "./integration-change-type-value.type.js";

type IntegrationAnalysisResult<T> = {
	explanation: string;
	matchedItem: null | T;
	score: null | number;
	type: IntegrationChangeTypeValue;
};

export { type IntegrationAnalysisResult };
