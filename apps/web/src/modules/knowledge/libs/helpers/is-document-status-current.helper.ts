import { type DocumentStatusResponseDto } from "@knowledgeprism/types";

const isDocumentStatusCurrent = (
	incoming: DocumentStatusResponseDto,
	previous: DocumentStatusResponseDto | undefined,
): boolean => {
	if (!previous) {
		return true;
	}
	if (incoming.processingAttempt !== previous.processingAttempt) {
		return incoming.processingAttempt > previous.processingAttempt;
	}
	if (incoming.updatedAt < previous.updatedAt) {
		return false;
	}
	const next = incoming.processingProgress;
	const current = previous.processingProgress;
	return !(
		next &&
		current &&
		next.phase === current.phase &&
		next.processedUnits < current.processedUnits
	);
};

export { isDocumentStatusCurrent };
