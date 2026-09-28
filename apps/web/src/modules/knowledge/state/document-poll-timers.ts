const pollTimersByDocumentId = new Map<number, ReturnType<typeof setTimeout>>();

const clearPollTimer = (documentId: number): void => {
	const timerId = pollTimersByDocumentId.get(documentId);

	if (timerId !== undefined) {
		clearTimeout(timerId);
		pollTimersByDocumentId.delete(documentId);
	}
};

const schedulePollTimer = (
	documentId: number,
	timerId: ReturnType<typeof setTimeout>,
): void => {
	clearPollTimer(documentId);
	pollTimersByDocumentId.set(documentId, timerId);
};

const clearAllPollTimers = (): void => {
	for (const documentId of pollTimersByDocumentId.keys()) {
		clearPollTimer(documentId);
	}
};

export { clearAllPollTimers, clearPollTimer, schedulePollTimer };
