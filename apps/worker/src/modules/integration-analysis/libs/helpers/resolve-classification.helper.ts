import { type IntegrationAnalysisResult } from "../types/integration-analysis-result.type.js";

const ClassificationRecovery = {
	FIRST_ATTEMPT: 1,
	MAXIMUM_ATTEMPTS: 3,
} as const;

const resolveClassification = async <T>({
	fallback,
	invoke,
	map,
	onUnparsable,
}: {
	fallback: () => IntegrationAnalysisResult<T>;
	invoke: () => Promise<unknown>;
	map: (raw: unknown) => IntegrationAnalysisResult<T> | null;
	onUnparsable: (attempt: number) => void;
}): Promise<IntegrationAnalysisResult<T>> => {
	for (
		let attempt: number = ClassificationRecovery.FIRST_ATTEMPT;
		attempt <= ClassificationRecovery.MAXIMUM_ATTEMPTS;
		attempt++
	) {
		const result = map(await invoke());

		if (result) {
			return result;
		}

		onUnparsable(attempt);
	}

	return fallback();
};

export { ClassificationRecovery, resolveClassification };
