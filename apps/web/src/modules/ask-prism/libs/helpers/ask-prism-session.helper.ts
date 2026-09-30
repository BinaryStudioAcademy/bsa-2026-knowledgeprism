import { DataStatus } from "~/lib/enums/enums.js";

import { type AskPrismMessage } from "../types/types.js";

const EMPTY_COUNT = 0;
const ASK_PRISM_STORAGE_PREFIX = "knowledgeprism/ask-prism-history";

const buildStorageKey = (projectId: string): string => {
	return `${ASK_PRISM_STORAGE_PREFIX}/${projectId}`;
};

const isMessage = (item: unknown): item is AskPrismMessage => {
	if (!item || typeof item !== "object") {
		return false;
	}

	const candidate = item as Record<string, unknown>;

	return (
		typeof candidate["id"] === "string" &&
		typeof candidate["query"] === "string" &&
		(candidate["answer"] === null || typeof candidate["answer"] === "string") &&
		Array.isArray(candidate["sources"])
	);
};

const readConversationHistory = (
	projectId: number | string,
): AskPrismMessage[] => {
	try {
		const raw = sessionStorage.getItem(buildStorageKey(String(projectId)));

		if (!raw) {
			return [];
		}

		const parsed: unknown = JSON.parse(raw);

		if (!Array.isArray(parsed)) {
			return [];
		}

		return parsed.filter(isMessage).map((message) => {
			if (message.dataStatus === DataStatus.PENDING) {
				return {
					...message,
					dataStatus: DataStatus.REJECTED,
					errorType: "connection",
				};
			}

			return message;
		});
	} catch {
		return [];
	}
};

const writeConversationHistory = (
	projectId: number | string,
	messages: AskPrismMessage[],
): void => {
	try {
		if (messages.length === EMPTY_COUNT) {
			sessionStorage.removeItem(buildStorageKey(String(projectId)));

			return;
		}

		sessionStorage.setItem(
			buildStorageKey(String(projectId)),
			JSON.stringify(messages),
		);
	} catch {
		return;
	}
};

const clearConversationHistory = (projectId: number | string): void => {
	try {
		sessionStorage.removeItem(buildStorageKey(String(projectId)));
	} catch {
		return;
	}
};

export {
	clearConversationHistory,
	readConversationHistory,
	writeConversationHistory,
};
