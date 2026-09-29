import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppRoute } from "~/lib/enums/enums.js";
import { store } from "~/lib/store/store.js";
import { askPrismApi } from "~/modules/ask-prism/ask-prism.js";

import { actions as askPrismActions } from "../../state/state.js";
import { AskPrismView } from "./ask-prism-view.js";

const ASK_REQUEST_COUNT = 1;
const PROJECT_ID = "7";
const TEST_TIMEOUT_MILLISECONDS = 15_000;
const SUGGESTED_QUESTION = "Tell me about authentication";
const MANUAL_QUESTION = "What is a knowledge node?";

const renderAskPrism = (): void => {
	render(
		<Provider store={store.instance}>
			<MemoryRouter initialEntries={[`/workspaces/${PROJECT_ID}/ask-prism`]}>
				<Routes>
					<Route element={<AskPrismView />} path={AppRoute.PROJECT_ASK_PRISM} />
				</Routes>
			</MemoryRouter>
		</Provider>,
	);
};

describe("AskPrismView question input", () => {
	afterEach(() => {
		store.instance.dispatch(askPrismActions.reset());
	});

	it(
		"sends a suggested question once and leaves the input empty",
		async () => {
			vi.spyOn(askPrismApi, "getSuggestedQuestions").mockResolvedValue([
				SUGGESTED_QUESTION,
			]);
			const ask = vi.spyOn(askPrismApi, "ask").mockResolvedValue({
				answer: "Authentication uses signed tokens.",
				sources: [],
			});

			renderAskPrism();

			const suggestion = await screen.findByRole("button", {
				name: SUGGESTED_QUESTION,
			});
			fireEvent.click(suggestion);

			expect(screen.getByRole("textbox")).toHaveValue("");
			await waitFor(() => {
				expect(ask).toHaveBeenCalledTimes(ASK_REQUEST_COUNT);
			});
			expect(ask).toHaveBeenCalledWith(Number(PROJECT_ID), {
				query: SUGGESTED_QUESTION,
			});
		},
		TEST_TIMEOUT_MILLISECONDS,
	);

	it(
		"clears a typed question after it is sent",
		async () => {
			vi.spyOn(askPrismApi, "getSuggestedQuestions").mockResolvedValue([
				SUGGESTED_QUESTION,
			]);
			vi.spyOn(askPrismApi, "ask").mockResolvedValue({
				answer: "A knowledge node is an approved entry.",
				sources: [],
			});

			renderAskPrism();
			await screen.findByRole("button", { name: SUGGESTED_QUESTION });

			const input = screen.getByRole("textbox");
			fireEvent.change(input, { target: { value: MANUAL_QUESTION } });
			fireEvent.click(screen.getByRole("button", { name: "Send question" }));

			expect(input).toHaveValue("");
		},
		TEST_TIMEOUT_MILLISECONDS,
	);
});
