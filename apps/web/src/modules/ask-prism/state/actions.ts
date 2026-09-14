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

const DEFAULT_SUGGESTED_QUESTIONS = [
	"What are the validation rules for user password?",
	"How does knowledge base integration work?",
	"What are the roles and permissions in a project?",
];

const getSimulatedAnswer = (
	query: string,
): AskPrismResponseDto | { errorType: "connection" } => {
	const lowerQuery = query.toLowerCase();

	if (
		lowerQuery.includes("disconnect") ||
		lowerQuery.includes("network error")
	) {
		return { errorType: "connection" };
	}

	if (lowerQuery.includes("password") || lowerQuery.includes("validation")) {
		return {
			answer:
				"Passwords must contain a minimum of 8 characters, including at least one uppercase letter, one number, and one special symbol. Whitespace characters are stripped, and common breached patterns are automatically rejected.",
			sources: [
				{
					id: "source-auth-rules",
					nodeId: "auth-rules",
					sectionTitle: "Password Validation & Complexity",
					title: "Authentication Specification",
				},
			],
		};
	}

	if (
		lowerQuery.includes("integration") ||
		lowerQuery.includes("pipeline") ||
		lowerQuery.includes("how does")
	) {
		return {
			answer:
				"Knowledge base integration operates in a strict human-in-the-loop chain:\n\n1. AI proposes structured knowledge from source documents.\n2. A human validates the proposed extraction items.\n3. The system integrates changes (NEW, UPDATE, DUPLICATE, or CONFLICT).\n4. A human approves the final integration before landing in the official knowledge base.",
			sources: [
				{
					id: "source-pipeline-architecture",
					nodeId: "knowledge-pipeline",
					sectionTitle: "Four Data States & Pipeline Loop",
					title: "Knowledge Base Architecture",
				},
			],
		};
	}

	if (
		lowerQuery.includes("role") ||
		lowerQuery.includes("permission") ||
		lowerQuery.includes("editor")
	) {
		return {
			answer:
				"KnowledgePrism implements 3 project roles with hierarchical access:\n\n- **ADMIN**: Manage organisation, users, projects, and access permissions.\n- **EDITOR**: Add/edit knowledge entries, validate extractions, and approve integrations.\n- **VIEWER**: Read-only access to knowledge entries and Ask Prism search.",
			sources: [
				{
					id: "source-project-roles",
					nodeId: "roles-permissions",
					sectionTitle: "Tenancy, Roles & Capabilities",
					title: "Project Access Policies",
				},
			],
		};
	}

	return {
		answer: "Not found in the knowledge tree",
		sources: [],
	};
};

const askQuestion = createAsyncThunk<
	AskPrismResponseDto,
	AskPrismRequestDto,
	AsyncThunkConfig
>(`${sliceName}/ask-question`, async (payload, { extra, rejectWithValue }) => {
	const { askPrismApi } = extra;

	try {
		return await askPrismApi.ask(payload);
	} catch (error: unknown) {
		// In development fallback, simulate responses
		const isPendingBackendInDevelopment =
			config.ENV.APP.ENVIRONMENT === AppEnvironment.DEVELOPMENT &&
			error instanceof HTTPError &&
			error.status === HTTPCode.NOT_FOUND;

		if (!isPendingBackendInDevelopment) {
			const isNotFoundError =
				error instanceof HTTPError && error.status === HTTPCode.NOT_FOUND;

			return rejectWithValue({
				errorType: isNotFoundError ? "not_found" : "connection",
			});
		}

		await new Promise((resolve) => {
			setTimeout(resolve, MOCK_SEARCH_DELAY_MS);
		});

		const simulated = getSimulatedAnswer(payload.query);

		if ("errorType" in simulated) {
			return rejectWithValue(simulated);
		}

		return simulated;
	}
});

const loadSuggestedQuestions = createAsyncThunk<
	string[],
	undefined | { projectId?: string },
	AsyncThunkConfig
>(`${sliceName}/load-suggested-questions`, async (payload, { extra }) => {
	const { askPrismApi } = extra;

	try {
		return await askPrismApi.getSuggestedQuestions(payload?.projectId);
	} catch {
		return DEFAULT_SUGGESTED_QUESTIONS;
	}
});

export { askQuestion, loadSuggestedQuestions };
