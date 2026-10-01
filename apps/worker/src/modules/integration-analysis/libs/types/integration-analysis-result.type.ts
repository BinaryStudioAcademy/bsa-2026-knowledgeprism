import { type IntegrationChangeTypeValue } from "./integration-change-type-value.type.js";

type IntegrationAnalysisResult<T> = {
	explanation: string;
	matchedItem: null | T;
	matches: ProposedWordingMatch<T>[];
	parentIndex: null | number;
	parentPriorIndex: null | number;
	proposesParent: boolean;
	score: null | number;
	siblingOrder: null | number;
	type: IntegrationChangeTypeValue;
};

type ProposedWordingMatch<T> = {
	item: T;
	span: string;
};

export { type IntegrationAnalysisResult };
