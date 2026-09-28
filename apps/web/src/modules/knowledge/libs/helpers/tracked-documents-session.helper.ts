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

		return parsed.filter(
			(value): value is number =>
				typeof value === "number" &&
				Number.isSafeInteger(value) &&
				value > EMPTY_LENGTH,
		);
	} catch {
		return [];
	}
};

const writeTrackedDocumentIds = (
	projectId: string,
	documentIds: number[],
): void => {
	try {
		const uniqueIds = [...new Set(documentIds)];

		if (uniqueIds.length === EMPTY_LENGTH) {
			sessionStorage.removeItem(buildStorageKey(projectId));

			return;
		}

		sessionStorage.setItem(
			buildStorageKey(projectId),
			JSON.stringify(uniqueIds),
		);
	} catch {
		// Tracking persistence is best-effort recovery state only.
	}
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
};
