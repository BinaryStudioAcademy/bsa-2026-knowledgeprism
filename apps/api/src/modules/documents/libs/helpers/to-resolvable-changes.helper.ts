import { IntegrationChangeType } from "@knowledgeprism/constants";

import { IntegrationChangeEntity } from "~/modules/documents/models/integration-change.entity.js";

const NO_WRITES = 0;
const SINGLE_WRITE = 1;
const SHARED_ENTRY_EXPLANATION =
	"Other items in this document also change this entry, so choose which values to keep.";

const isWriteChange = (change: IntegrationChangeEntity): boolean => {
	const { matchedNodeId, type } = change.toObject();

	return (
		matchedNodeId !== null &&
		(type === IntegrationChangeType.CONFLICT ||
			type === IntegrationChangeType.UPDATE)
	);
};

const countWritesPerEntry = (
	changes: IntegrationChangeEntity[],
): Map<number, number> => {
	const writesPerEntry = new Map<number, number>();

	for (const change of changes) {
		const { matchedNodeId } = change.toObject();

		if (matchedNodeId !== null && isWriteChange(change)) {
			writesPerEntry.set(
				matchedNodeId,
				(writesPerEntry.get(matchedNodeId) ?? NO_WRITES) + SINGLE_WRITE,
			);
		}
	}

	return writesPerEntry;
};

const toResolvableChanges = (
	changes: IntegrationChangeEntity[],
): IntegrationChangeEntity[] => {
	const writesPerEntry = countWritesPerEntry(changes);

	return changes.map((change) => {
		const newChange = change.toNewObject();
		const { matchedNodeId, type } = newChange;
		const isSharedUpdate =
			type === IntegrationChangeType.UPDATE &&
			matchedNodeId !== null &&
			(writesPerEntry.get(matchedNodeId) ?? NO_WRITES) > SINGLE_WRITE;

		return isSharedUpdate
			? IntegrationChangeEntity.initializeNew({
					...newChange,
					explanation: `${newChange.explanation} ${SHARED_ENTRY_EXPLANATION}`,
					type: IntegrationChangeType.CONFLICT,
				})
			: change;
	});
};

export { toResolvableChanges };
