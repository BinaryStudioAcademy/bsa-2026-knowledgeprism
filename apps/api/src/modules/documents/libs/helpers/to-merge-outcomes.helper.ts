import {
	IntegrationChangeType,
	IntegrationResolution,
} from "@knowledgeprism/constants";
import { type IntegrationConflictResolutionDto } from "@knowledgeprism/types";

import { NodeMergeMethod } from "~/modules/documents/libs/constants/node-merge-method.constant.js";
import { type IntegrationChangeEntity } from "~/modules/documents/models/integration-change.entity.js";

const MergeOutcome = {
	ACCEPTED: "accepted",
	DECLINED: "declined",
	EDITED: "edited",
	FALLBACK: "fallback",
} as const;

type MergeOutcomes = Record<MergeOutcomeValue, number>;

type MergeOutcomeValue = (typeof MergeOutcome)[keyof typeof MergeOutcome];

const toMergeOutcome = (
	change: IntegrationChangeEntity,
	resolution: IntegrationConflictResolutionDto | undefined,
): MergeOutcomeValue | null => {
	const { mergedBlocks, mergeMethod, type } = change.toObject();

	if (mergeMethod === null || mergeMethod === undefined) {
		return null;
	}

	if (
		type === IntegrationChangeType.CONFLICT &&
		resolution?.content !== IntegrationResolution.BOTH
	) {
		return MergeOutcome.DECLINED;
	}

	if (mergeMethod === NodeMergeMethod.FALLBACK) {
		return MergeOutcome.FALLBACK;
	}

	return mergedBlocks ? MergeOutcome.ACCEPTED : MergeOutcome.EDITED;
};

const toMergeOutcomes = (
	changes: IntegrationChangeEntity[],
	resolutionByChangeId: Map<number, IntegrationConflictResolutionDto>,
): MergeOutcomes => {
	const outcomes = changes.map((change) =>
		toMergeOutcome(change, resolutionByChangeId.get(change.toObject().id)),
	);
	const countOf = (outcome: MergeOutcomeValue): number =>
		outcomes.filter((value) => value === outcome).length;

	return {
		[MergeOutcome.ACCEPTED]: countOf(MergeOutcome.ACCEPTED),
		[MergeOutcome.DECLINED]: countOf(MergeOutcome.DECLINED),
		[MergeOutcome.EDITED]: countOf(MergeOutcome.EDITED),
		[MergeOutcome.FALLBACK]: countOf(MergeOutcome.FALLBACK),
	};
};

export { toMergeOutcomes };
