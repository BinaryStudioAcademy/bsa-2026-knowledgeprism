import { IntegrationChangeType } from "@knowledgeprism/constants";
import { type ValueOf } from "@knowledgeprism/types";

type IntegrationMetrics = Record<
	ValueOf<typeof IntegrationChangeType>,
	number
> & {
	sections: number;
	skippedClassification: number;
};

const NO_CHANGES = 0;

const toIntegrationMetrics = ({
	skippedClassification,
	types,
}: {
	skippedClassification: number;
	types: ValueOf<typeof IntegrationChangeType>[];
}): IntegrationMetrics => {
	const countOf = (type: ValueOf<typeof IntegrationChangeType>): number =>
		types.filter((value) => value === type).length;

	return {
		[IntegrationChangeType.CONFLICT]: countOf(IntegrationChangeType.CONFLICT),
		[IntegrationChangeType.DUPLICATE]: countOf(IntegrationChangeType.DUPLICATE),
		[IntegrationChangeType.NEW]: countOf(IntegrationChangeType.NEW),
		[IntegrationChangeType.UPDATE]: countOf(IntegrationChangeType.UPDATE),
		sections: types.length || NO_CHANGES,
		skippedClassification,
	};
};

export { toIntegrationMetrics };
