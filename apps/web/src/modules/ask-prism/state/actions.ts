import { HTTPCode } from "@knowledgeprism/constants";
import {
	type AskPrismRequestDto,
	type AskPrismResponseDto,
} from "@knowledgeprism/types";
import { createAsyncThunk } from "@reduxjs/toolkit";

import { config } from "~/lib/config/config.js";
import { AppEnvironment } from "~/lib/enums/enums.js";
import { HTTPError } from "~/lib/http/http.js";
import { type AsyncThunkConfig } from "~/lib/types/types.js";

import { name as sliceName } from "./ask-prism.slice.js";

const MOCK_SEARCH_DELAY_MS = 650;

const askQuestion = createAsyncThunk<
	AskPrismResponseDto,
	AskPrismRequestDto,
	AsyncThunkConfig
>(`${sliceName}/ask-question`, async (payload, { extra }) => {
	const { askPrismApi } = extra;

	try {
		return await askPrismApi.ask(payload);
	} catch (error: unknown) {
		// Only use mock data during development when the backend endpoint is not yet implemented (404)
		const isPendingBackendInDevelopment =
			config.ENV.APP.ENVIRONMENT === AppEnvironment.DEVELOPMENT &&
			error instanceof HTTPError &&
			error.status === HTTPCode.NOT_FOUND;

		if (!isPendingBackendInDevelopment) {
			throw error;
		}

		await new Promise((resolve) => {
			setTimeout(resolve, MOCK_SEARCH_DELAY_MS);
		});

		if (payload.query.toLowerCase().includes("unknown")) {
			return {
				answer: "No info",
				sources: [],
			};
		}

		return {
			answer: `Based on the project knowledge base, here is the answer regarding "${payload.query}":\n\nThe system enforces strict validation and access control.
Passwords
require a minimum length and complexity check. All knowledge node modifications are tracked with versioning, and AI proposals must be human-validated before integration.`,
			sources: [
				{
					id: "source-1",
					nodeId: "auth-rules",
					sectionTitle: "Validation & Security Policies",
					title: "Authentication Specification",
				},
				{
					id: "source-2",
					nodeId: "knowledge-pipeline",
					sectionTitle: "Integration Chain",
					title: "Knowledge Base Architecture",
				},
			],
		};
	}
});

export { askQuestion };
