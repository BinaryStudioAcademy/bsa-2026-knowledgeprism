import { beforeEach, describe, expect, it } from "vitest";

import { DataStatus } from "~/lib/enums/enums.js";

import { type AskPrismMessage } from "../types/types.js";
import {
	clearConversationHistory,
	readConversationHistory,
	writeConversationHistory,
} from "./ask-prism-session.helper.js";

const PROJECT_ID = 42;
const EMPTY_COUNT = 0;
const SINGLE_COUNT = 1;
const FIRST_INDEX = 0;

const MOCK_MESSAGE: AskPrismMessage = {
	answer: "Paris",
	dataStatus: DataStatus.FULFILLED,
	errorType: null,
	id: "msg-1",
	query: "What is the capital of France?",
	sources: [
		{
			documentName: null,
			excerpt: "Capital city",
			id: 1,
			nodeId: 10,
			pageNumber: null,
			sectionTitle: "Geography",
			title: "France",
		},
	],
};

describe("ask-prism-session helper", () => {
	beforeEach(() => {
		sessionStorage.clear();
	});

	it("returns empty array when storage is empty", () => {
		const result = readConversationHistory(PROJECT_ID);
		expect(result).toEqual([]);
	});

	it("writes and reads conversation history correctly", () => {
		writeConversationHistory(PROJECT_ID, [MOCK_MESSAGE]);
		const result = readConversationHistory(PROJECT_ID);

		expect(result).toHaveLength(SINGLE_COUNT);
		expect(result[FIRST_INDEX]?.query).toBe("What is the capital of France?");
		expect(result[FIRST_INDEX]?.answer).toBe("Paris");
	});

	it("clears conversation history when clearConversationHistory is called", () => {
		writeConversationHistory(PROJECT_ID, [MOCK_MESSAGE]);
		clearConversationHistory(PROJECT_ID);
		const result = readConversationHistory(PROJECT_ID);

		expect(result).toHaveLength(EMPTY_COUNT);
	});

	it("recovers pending messages as rejected if page was reloaded mid-flight", () => {
		const pendingMessage: AskPrismMessage = {
			...MOCK_MESSAGE,
			answer: null,
			dataStatus: DataStatus.PENDING,
		};

		writeConversationHistory(PROJECT_ID, [pendingMessage]);
		const result = readConversationHistory(PROJECT_ID);

		expect(result[FIRST_INDEX]?.dataStatus).toBe(DataStatus.REJECTED);
		expect(result[FIRST_INDEX]?.errorType).toBe("connection");
	});
});
