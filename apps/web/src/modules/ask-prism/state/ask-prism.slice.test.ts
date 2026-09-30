import { beforeEach, describe, expect, it } from "vitest";

import { DataStatus } from "~/lib/enums/enums.js";

import { actions, reducer } from "./ask-prism.slice.js";

const PROJECT_ONE_ID = 1;
const PROJECT_TWO_ID = 2;
const EMPTY_COUNT = 0;
const SINGLE_COUNT = 1;
const TWO_COUNT = 2;
const FIRST_INDEX = 0;
const SECOND_INDEX = 1;

describe("askPrism slice", () => {
	beforeEach(() => {
		sessionStorage.clear();
	});

	it("initializes with empty conversationsByProject", () => {
		const state = reducer(undefined, { type: "UNKNOWN" });

		expect(state.conversationsByProject).toEqual({});
		expect(state.dataStatus).toBe(DataStatus.IDLE);
	});

	it("initializes project conversation when initProject is dispatched", () => {
		const state = reducer(
			undefined,
			actions.initProject({ projectId: PROJECT_ONE_ID }),
		);

		expect(state.currentProjectId).toBe(PROJECT_ONE_ID);
		expect(state.conversationsByProject[PROJECT_ONE_ID]).toEqual([]);
	});

	it("appends a new pending message when askQuestion.pending is dispatched", () => {
		const pendingAction = {
			meta: {
				arg: {
					projectId: PROJECT_ONE_ID,
					query: "How does ingestion work?",
				},
				requestId: "req-1",
			},
			type: "askPrism/ask-question/pending",
		};

		const state = reducer(undefined, pendingAction);
		const messages = state.conversationsByProject[PROJECT_ONE_ID] ?? [];

		expect(messages).toHaveLength(SINGLE_COUNT);
		expect(messages[FIRST_INDEX]).toEqual({
			answer: null,
			dataStatus: DataStatus.PENDING,
			errorType: null,
			id: "req-1",
			query: "How does ingestion work?",
			sources: [],
		});
	});

	it("appends multiple questions into the conversation thread", () => {
		let state = reducer(undefined, {
			meta: {
				arg: {
					projectId: PROJECT_ONE_ID,
					query: "Question 1",
				},
				requestId: "req-1",
			},
			type: "askPrism/ask-question/pending",
		});

		state = reducer(state, {
			meta: {
				arg: {
					projectId: PROJECT_ONE_ID,
					query: "Question 1",
				},
				requestId: "req-1",
			},
			payload: {
				answer: "Answer 1",
				sources: [],
			},
			type: "askPrism/ask-question/fulfilled",
		});

		state = reducer(state, {
			meta: {
				arg: {
					projectId: PROJECT_ONE_ID,
					query: "Question 2",
				},
				requestId: "req-2",
			},
			type: "askPrism/ask-question/pending",
		});

		const messages = state.conversationsByProject[PROJECT_ONE_ID] ?? [];
		expect(messages).toHaveLength(TWO_COUNT);
		expect(messages[FIRST_INDEX]?.query).toBe("Question 1");
		expect(messages[FIRST_INDEX]?.answer).toBe("Answer 1");
		expect(messages[SECOND_INDEX]?.query).toBe("Question 2");
		expect(messages[SECOND_INDEX]?.dataStatus).toBe(DataStatus.PENDING);
	});

	it("updates existing message when retrying with messageId", () => {
		let state = reducer(undefined, {
			meta: {
				arg: {
					projectId: PROJECT_ONE_ID,
					query: "Failed question",
				},
				requestId: "req-fail",
			},
			type: "askPrism/ask-question/pending",
		});

		state = reducer(state, {
			meta: {
				arg: {
					projectId: PROJECT_ONE_ID,
					query: "Failed question",
				},
				requestId: "req-fail",
			},
			payload: { errorType: "connection" },
			type: "askPrism/ask-question/rejected",
		});

		const failedMessages = state.conversationsByProject[PROJECT_ONE_ID] ?? [];
		expect(failedMessages[FIRST_INDEX]?.dataStatus).toBe(DataStatus.REJECTED);

		state = reducer(state, {
			meta: {
				arg: {
					messageId: "req-fail",
					projectId: PROJECT_ONE_ID,
					query: "Failed question",
				},
				requestId: "req-retry",
			},
			type: "askPrism/ask-question/pending",
		});

		const messages = state.conversationsByProject[PROJECT_ONE_ID] ?? [];
		expect(messages).toHaveLength(SINGLE_COUNT);
		expect(messages[FIRST_INDEX]?.dataStatus).toBe(DataStatus.PENDING);
		expect(messages[FIRST_INDEX]?.errorType).toBeNull();
	});

	it("isolates conversation history between different projects", () => {
		let state = reducer(undefined, {
			meta: {
				arg: {
					projectId: PROJECT_ONE_ID,
					query: "Project 1 Question",
				},
				requestId: "req-p1",
			},
			type: "askPrism/ask-question/pending",
		});

		state = reducer(state, {
			meta: {
				arg: {
					projectId: PROJECT_TWO_ID,
					query: "Project 2 Question",
				},
				requestId: "req-p2",
			},
			type: "askPrism/ask-question/pending",
		});

		const projectOneMessages =
			state.conversationsByProject[PROJECT_ONE_ID] ?? [];
		const projectTwoMessages =
			state.conversationsByProject[PROJECT_TWO_ID] ?? [];

		expect(projectOneMessages).toHaveLength(SINGLE_COUNT);
		expect(projectOneMessages[FIRST_INDEX]?.query).toBe("Project 1 Question");

		expect(projectTwoMessages).toHaveLength(SINGLE_COUNT);
		expect(projectTwoMessages[FIRST_INDEX]?.query).toBe("Project 2 Question");
	});

	it("clears conversation history only for the specified project", () => {
		let state = reducer(undefined, {
			meta: {
				arg: {
					projectId: PROJECT_ONE_ID,
					query: "Question 1",
				},
				requestId: "req-1",
			},
			type: "askPrism/ask-question/pending",
		});

		state = reducer(state, {
			meta: {
				arg: {
					projectId: PROJECT_TWO_ID,
					query: "Question 2",
				},
				requestId: "req-2",
			},
			type: "askPrism/ask-question/pending",
		});

		state = reducer(state, actions.clearHistory({ projectId: PROJECT_ONE_ID }));

		expect(state.conversationsByProject[PROJECT_ONE_ID]).toHaveLength(
			EMPTY_COUNT,
		);
		expect(state.conversationsByProject[PROJECT_TWO_ID]).toHaveLength(
			SINGLE_COUNT,
		);
	});
});
