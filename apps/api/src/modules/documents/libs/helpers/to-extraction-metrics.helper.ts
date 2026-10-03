import {
	BedrockResponseFailure,
	type ExtractionResponseRecord,
	type KnowledgeItem,
} from "@knowledgeprism/worker";

type ExtractionMetrics = {
	averageSectionLength: number;
	chunks: number;
	failedPages: number;
	llmCalls: number;
	maximumSectionLength: number;
	pages: number;
	retries: number;
	sections: number;
	truncations: number;
};

const FIRST_ATTEMPT = 1;
const NO_SECTIONS = 0;

const toExtractionMetrics = ({
	chunkCount,
	failedPageNumbers,
	items,
	pageCount,
	responses,
}: {
	chunkCount: number;
	failedPageNumbers: number[];
	items: KnowledgeItem[];
	pageCount: number;
	responses: ExtractionResponseRecord[];
}): ExtractionMetrics => {
	const lengths = items.map(({ text }) => text.length);
	const totalLength = lengths.reduce(
		(total, length) => total + length,
		NO_SECTIONS,
	);

	return {
		averageSectionLength:
			items.length === NO_SECTIONS
				? NO_SECTIONS
				: Math.round(totalLength / items.length),
		chunks: chunkCount,
		failedPages: failedPageNumbers.length,
		llmCalls: responses.length,
		maximumSectionLength: Math.max(NO_SECTIONS, ...lengths),
		pages: pageCount,
		retries: responses.filter(
			({ attempt, splitPart }) => attempt > FIRST_ATTEMPT || splitPart !== null,
		).length,
		sections: items.length,
		truncations: responses.filter(
			({ errorReason }) => errorReason === BedrockResponseFailure.TRUNCATED,
		).length,
	};
};

export { toExtractionMetrics };
