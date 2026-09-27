import { EMPTY_LENGTH } from "../constants/constants.js";

const TRACKED_DOCUMENTS_STORAGE_PREFIX = "knowledgeprism/tracked-documents";

const buildStorageKey = (projectId: string): string =>
	`${TRACKED_DOCUMENTS_STORAGE_PREFIX}/${projectId}`;

const readTrackedDocumentIds = (projectId: string): number[] => {
	try {
		const raw = sessionStorage.getItem(buildStorageKey(projectId));

		if (!raw) {
			return [];
		}

		const parsed: unknown = JSON.parse(raw);

		if (!Array.isArray(parsed)) {
			return [];
		}

		return parsed.filter((value): value is number => typeof value === "number");
	} catch {
		return [];
	}
};

const writeTrackedDocumentIds = (
	projectId: string,
	documentIds: number[],
): void => {
	const uniqueIds = [...new Set(documentIds)];

	if (uniqueIds.length === EMPTY_LENGTH) {
		sessionStorage.removeItem(buildStorageKey(projectId));

		return;
	}

	sessionStorage.setItem(buildStorageKey(projectId), JSON.stringify(uniqueIds));
};

const addTrackedDocumentId = (projectId: string, documentId: number): void => {
	const ids = readTrackedDocumentIds(projectId);
	writeTrackedDocumentIds(projectId, [...ids, documentId]);
};

const removeTrackedDocumentId = (
	projectId: string,
	documentId: number,
): void => {
	const ids = readTrackedDocumentIds(projectId).filter(
		(id) => id !== documentId,
	);
	writeTrackedDocumentIds(projectId, ids);
};

export {
	addTrackedDocumentId,
	readTrackedDocumentIds,
	removeTrackedDocumentId,
	writeTrackedDocumentIds,
};
