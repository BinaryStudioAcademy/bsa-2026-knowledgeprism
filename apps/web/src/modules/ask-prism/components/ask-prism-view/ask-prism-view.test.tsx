import { type AskPrismResponseDto } from "@knowledgeprism/types";
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { type JSX, useEffect } from "react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { store } from "~/lib/store/store.js";
import { askPrismApi } from "~/modules/ask-prism/ask-prism.js";
import { DEFAULT_SUGGESTED_QUESTIONS } from "~/modules/ask-prism/libs/constants.js";
import { actions } from "~/modules/ask-prism/state/state.js";

import { AskPrismView } from "./ask-prism-view.js";

const PROJECT_ID = "1";
const PROJECT_TWO_ID = "2";
const FIRST_QUESTION_INDEX = 0;

const FIRST_DEFAULT_QUESTION =
	DEFAULT_SUGGESTED_QUESTIONS[FIRST_QUESTION_INDEX] ?? "";

const CUSTOM_SUGGESTIONS = [
	"Tell me about Authentication Architecture",
	"Tell me about Database Schema",
	"Tell me about API Endpoints",
];

const MOCK_ANSWER: AskPrismResponseDto = {
	answer: "Authentication uses JWT tokens for security.",
	sources: [
		{
			documentName: null,
			excerpt: "Authentication uses JWT tokens",
			id: 1,
			nodeId: 1,
			pageNumber: null,
			sectionTitle: "Auth",
			title: "Authentication",
		},
	],
};

const ProjectRoute = ({ projectId }: { projectId: string }): JSX.Element => {
	const navigate = useNavigate();

	useEffect(() => {
		void navigate(`/projects/${projectId}/ask-prism`);
	}, [navigate, projectId]);

	return (
		<Routes>
			<Route element={<AskPrismView />} path="/projects/:projectId/ask-prism" />
		</Routes>
	);
};

const renderAskPrismView = (projectId = PROJECT_ID): void => {
	render(
		<Provider store={store.instance}>
			<MemoryRouter initialEntries={[`/projects/${projectId}/ask-prism`]}>
				<ProjectRoute projectId={projectId} />
			</MemoryRouter>
		</Provider>,
	);
};

describe("AskPrismView suggested questions behavior", () => {
	beforeEach(() => {
		sessionStorage.clear();
		HTMLElement.prototype.scrollIntoView = vi.fn();
		store.instance.dispatch(actions.reset());
		vi.spyOn(askPrismApi, "getSuggestedQuestions").mockResolvedValue(
			CUSTOM_SUGGESTIONS,
		);
		vi.spyOn(askPrismApi, "ask").mockResolvedValue(MOCK_ANSWER);
	});

	afterEach(() => {
		sessionStorage.clear();
		store.instance.dispatch(actions.reset());
		vi.restoreAllMocks();
	});

	it("clears search input and excludes prompt from suggestions when prompt is clicked", async () => {
		renderAskPrismView();

		await waitFor(() => {
			expect(
				screen.getByRole("button", {
					name: "Tell me about Authentication Architecture",
				}),
			).toBeInTheDocument();
		});

		const promptButton = screen.getByRole("button", {
			name: "Tell me about Authentication Architecture",
		});
		const searchInput = screen.getByPlaceholderText<HTMLInputElement>(
			"Ask anything about your knowledge base...",
		);

		act(() => {
			fireEvent.click(promptButton);
		});

		expect(searchInput.value).toBe("");
		expect(
			screen.queryByRole("button", {
				name: "Tell me about Authentication Architecture",
			}),
		).not.toBeInTheDocument();
		expect(
			screen.getByRole("button", {
				name: "Tell me about Database Schema",
			}),
		).toBeInTheDocument();
	});

	it("clears search input and excludes manually submitted query from suggestions", async () => {
		renderAskPrismView();

		await waitFor(() => {
			expect(
				screen.getByRole("button", {
					name: "Tell me about Database Schema",
				}),
			).toBeInTheDocument();
		});

		const searchInput = screen.getByPlaceholderText<HTMLInputElement>(
			"Ask anything about your knowledge base...",
		);

		act(() => {
			fireEvent.change(searchInput, {
				target: { value: "Tell me about Database Schema" },
			});
			fireEvent.keyDown(searchInput, { key: "Enter" });
		});

		expect(searchInput.value).toBe("");
		expect(
			screen.queryByRole("button", {
				name: "Tell me about Database Schema",
			}),
		).not.toBeInTheDocument();
	});

	it("hides suggested questions when all custom suggestions are asked", async () => {
		renderAskPrismView();

		await waitFor(() => {
			expect(
				screen.getByRole("button", {
					name: "Tell me about Authentication Architecture",
				}),
			).toBeInTheDocument();
		});

		for (const prompt of CUSTOM_SUGGESTIONS) {
			const button = await screen.findByRole("button", { name: prompt });
			await waitFor(() => {
				expect(button).toBeEnabled();
			});
			act(() => {
				fireEvent.click(button);
			});
			await waitFor(() => {
				expect(
					screen.queryByRole("button", { name: prompt }),
				).not.toBeInTheDocument();
			});
		}

		await waitFor(() => {
			expect(
				screen.queryByText(/suggested questions:/i),
			).not.toBeInTheDocument();
			expect(
				screen.queryByRole("button", {
					name: FIRST_DEFAULT_QUESTION,
				}),
			).not.toBeInTheDocument();
		});
	});

	it("resets asked queries when switching projects", async () => {
		const { rerender } = render(
			<Provider store={store.instance}>
				<MemoryRouter initialEntries={[`/projects/${PROJECT_ID}/ask-prism`]}>
					<ProjectRoute projectId={PROJECT_ID} />
				</MemoryRouter>
			</Provider>,
		);

		await waitFor(() => {
			expect(
				screen.getByRole("button", {
					name: "Tell me about Authentication Architecture",
				}),
			).toBeInTheDocument();
		});

		const promptButton = screen.getByRole("button", {
			name: "Tell me about Authentication Architecture",
		});
		act(() => {
			fireEvent.click(promptButton);
		});

		expect(
			screen.queryByRole("button", {
				name: "Tell me about Authentication Architecture",
			}),
		).not.toBeInTheDocument();

		rerender(
			<Provider store={store.instance}>
				<MemoryRouter initialEntries={[`/projects/${PROJECT_ID}/ask-prism`]}>
					<ProjectRoute projectId={PROJECT_TWO_ID} />
				</MemoryRouter>
			</Provider>,
		);

		await waitFor(() => {
			expect(
				screen.getByRole("button", {
					name: "Tell me about Authentication Architecture",
				}),
			).toBeInTheDocument();
		});
	});

	it("renders scroll container with vertical scrolling only and source chips without hover scale effect", async () => {
		renderAskPrismView();

		await waitFor(() => {
			expect(
				screen.getByRole("button", {
					name: "Tell me about Authentication Architecture",
				}),
			).toBeInTheDocument();
		});

		const promptButton = screen.getByRole("button", {
			name: "Tell me about Authentication Architecture",
		});

		act(() => {
			fireEvent.click(promptButton);
		});

		const sourceButton = await screen.findByRole("button", {
			name: /Authentication/i,
		});

		expect(sourceButton).toBeInTheDocument();
		expect(sourceButton.className).toContain("transition-colors");
		expect(sourceButton.className).not.toContain("hover:scale");
		expect(sourceButton.className).not.toContain("active:scale");

		const scrollContainer = sourceButton.closest(".overflow-y-auto");
		expect(scrollContainer).toBeInTheDocument();
		expect(scrollContainer?.className).toContain("overflow-x-hidden");
	});
});
