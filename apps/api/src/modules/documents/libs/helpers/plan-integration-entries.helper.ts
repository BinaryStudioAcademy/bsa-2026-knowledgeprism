import { DocumentErrorMessage } from "@knowledgeprism/constants";
import { type IntegrationChangesApplyRequestDto } from "@knowledgeprism/types";

import { HTTPCode, HTTPError } from "~/infrastructure/http/http.js";
import { type IntegrationChangeEntity } from "~/modules/documents/models/integration-change.entity.js";

type Placement = NonNullable<
	IntegrationChangesApplyRequestDto["placements"]
>[number];

type PlannedIntegrationEntry = {
	change: IntegrationChangeEntity;
	parentExtractionItemId: null | number;
	parentId: null | number;
	position: number;
};

const EMPTY_LENGTH = 0;

const createInvalidIncomingPlacementError = (): HTTPError =>
	new HTTPError({
		message: DocumentErrorMessage.INVALID_INCOMING_PLACEMENT,
		status: HTTPCode.BAD_REQUEST,
	});

const mapPlacements = (
	placements: Placement[],
	knownChangeIds: ReadonlySet<number>,
): Map<number, Placement> => {
	const byChangeId = new Map<number, Placement>();

	for (const placement of placements) {
		if (
			!knownChangeIds.has(placement.changeId) ||
			byChangeId.has(placement.changeId) ||
			(placement.parentId !== null && placement.parentExtractionItemId != null)
		) {
			throw createInvalidIncomingPlacementError();
		}

		byChangeId.set(placement.changeId, placement);
	}

	return byChangeId;
};

const orderEntries = (
	entries: PlannedIntegrationEntry[],
	existingParentItemIds: ReadonlySet<number>,
): PlannedIntegrationEntry[] => {
	const pending = new Map(
		entries.map((entry) => [entry.change.toObject().extractionItemId, entry]),
	);
	const ordered: PlannedIntegrationEntry[] = [];
	const completed = new Set(existingParentItemIds);

	while (pending.size > EMPTY_LENGTH) {
		const ready = pending
			.values()
			.filter(
				({ parentExtractionItemId }) =>
					parentExtractionItemId === null ||
					completed.has(parentExtractionItemId),
			)
			.toArray();

		if (ready.length === EMPTY_LENGTH) {
			throw createInvalidIncomingPlacementError();
		}

		for (const entry of ready) {
			const { extractionItemId } = entry.change.toObject();
			pending.delete(extractionItemId);
			completed.add(extractionItemId);
			ordered.push(entry);
		}
	}

	return ordered;
};

const planIntegrationEntries = ({
	changes,
	existingParentItemIds,
	knownChangeIds,
	placements,
}: {
	changes: IntegrationChangeEntity[];
	existingParentItemIds: ReadonlySet<number>;
	knownChangeIds: ReadonlySet<number>;
	placements: Placement[];
}): PlannedIntegrationEntry[] => {
	const byChangeId = mapPlacements(placements, knownChangeIds);
	const itemIds = new Set([
		...existingParentItemIds,
		...changes.map((change) => change.toObject().extractionItemId),
	]);
	const entries = changes
		.map((change, index) => {
			const placement = byChangeId.get(change.toObject().id);
			const parentExtractionItemId = placement?.parentExtractionItemId ?? null;

			if (
				parentExtractionItemId !== null &&
				!itemIds.has(parentExtractionItemId)
			) {
				throw createInvalidIncomingPlacementError();
			}

			return {
				change,
				parentExtractionItemId,
				parentId: placement?.parentId ?? null,
				position: placement?.position ?? index,
			};
		})
		.toSorted((left, right) => left.position - right.position);

	return orderEntries(entries, existingParentItemIds);
};

export { createInvalidIncomingPlacementError, planIntegrationEntries };
