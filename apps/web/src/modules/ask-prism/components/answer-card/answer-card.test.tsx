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
	documentName: null,
	excerpt: "Authentication uses signed tokens.",
	id: DUPLICATE_SOURCE_ID,
	nodeId: DUPLICATE_SOURCE_ID,
	pageNumber: null,
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

	it("displays document name and page number when provided", () => {
		renderAnswer([
			createSource({
				documentName: "security-spec.pdf",
				id: DISTINCT_SOURCE_ID,
				nodeId: DISTINCT_SOURCE_ID,
				pageNumber: 14,
				sectionTitle: "Authentication",
				title: "Auth Overview",
			}),
		]);

		const source = screen.getByRole("button", { name: /Auth Overview/ });

		expect(source).toHaveTextContent("Auth Overview");
		expect(source).toHaveTextContent("security-spec.pdf, p. 14");
		expect(source).toHaveAttribute(
			"title",
			"Jump to Authentication (security-spec.pdf, p. 14)",
		);
	});

	it("displays document name without page number when page number is null", () => {
		renderAnswer([
			createSource({
				documentName: "security-spec.pdf",
				id: DISTINCT_SOURCE_ID,
				nodeId: DISTINCT_SOURCE_ID,
				pageNumber: null,
				sectionTitle: "Authentication",
				title: "Auth Overview",
			}),
		]);

		const source = screen.getByRole("button", { name: /Auth Overview/ });

		expect(source).toHaveTextContent("Auth Overview");
		expect(source).toHaveTextContent("security-spec.pdf");
		expect(source).not.toHaveTextContent("p.");
	});

	it("displays only page number when document name matches title", () => {
		renderAnswer([
			createSource({
				documentName: "security-spec.pdf",
				id: DISTINCT_SOURCE_ID,
				nodeId: DISTINCT_SOURCE_ID,
				pageNumber: 7,
				sectionTitle: "security-spec.pdf",
				title: "security-spec.pdf",
			}),
		]);

		const source = screen.getByRole("button", { name: /security-spec\.pdf/ });

		expect(source).toHaveTextContent("security-spec.pdf");
		expect(source).toHaveTextContent("p. 7");
	});

	it("gracefully falls back to title without document info when documentName is null", () => {
		renderAnswer([
			createSource({
				documentName: null,
				id: DISTINCT_SOURCE_ID,
				nodeId: DISTINCT_SOURCE_ID,
				pageNumber: null,
				sectionTitle: "Manual Note",
				title: "Manual Note",
			}),
		]);

		const source = screen.getByRole("button", { name: /Manual Note/ });

		expect(source).toHaveTextContent("Manual Note");
		expect(source).not.toHaveTextContent("·");
		expect(source).toHaveAttribute("title", "Jump to Manual Note");
	});
});
