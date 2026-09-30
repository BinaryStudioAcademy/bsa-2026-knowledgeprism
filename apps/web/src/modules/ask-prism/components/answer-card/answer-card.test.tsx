import { type AskPrismSourceDto } from "@knowledgeprism/types";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DataStatus } from "~/lib/enums/enums.js";

import { AnswerCard } from "./answer-card.js";

const DUPLICATE_SOURCE_ID = 1;
const DISTINCT_SOURCE_ID = 2;
const SINGLE_SOURCE_COUNT = 1;

const createSource = (
	overrides: Partial<AskPrismSourceDto> = {},
): AskPrismSourceDto => ({
	excerpt: "Authentication uses signed tokens.",
	id: DUPLICATE_SOURCE_ID,
	nodeId: DUPLICATE_SOURCE_ID,
	sectionTitle: "Authentication",
	title: "Authentication",
	...overrides,
});

const renderAnswer = (sources: AskPrismSourceDto[]): void => {
	render(
		<AnswerCard
			answer="Authentication uses signed tokens."
			dataStatus={DataStatus.FULFILLED}
			onSourceSelect={vi.fn()}
			query="How does authentication work?"
			sources={sources}
		/>,
	);
};

describe("AnswerCard sources", () => {
	it("lists each source once when the title and section title match", () => {
		renderAnswer([
			createSource(),
			createSource({
				id: DUPLICATE_SOURCE_ID,
				nodeId: DUPLICATE_SOURCE_ID,
			}),
		]);

		expect(
			screen.getAllByRole("button", { name: "Authentication" }),
		).toHaveLength(SINGLE_SOURCE_COUNT);
	});

	it("keeps a section title when it differs from the source title", () => {
		renderAnswer([
			createSource({
				id: DISTINCT_SOURCE_ID,
				nodeId: DISTINCT_SOURCE_ID,
				sectionTitle: "Sign-in flow",
				title: "Authentication",
			}),
		]);

		const source = screen.getByRole("button", { name: /Authentication/ });

		expect(source).toHaveTextContent("Authentication");
		expect(source).toHaveTextContent("Sign-in flow");
	});
});
