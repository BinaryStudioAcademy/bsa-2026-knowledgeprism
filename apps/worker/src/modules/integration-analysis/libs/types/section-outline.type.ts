import { type IntegrationAnalysisResult } from "./integration-analysis-result.type.js";

type OutlineSection = {
	text: string;
	title: string;
};

type SectionOutline = Pick<
	IntegrationAnalysisResult<unknown>,
	"parentIndex" | "parentPriorIndex" | "proposesParent" | "siblingOrder"
>;

export { type OutlineSection, type SectionOutline };
