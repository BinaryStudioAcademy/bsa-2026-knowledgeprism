import {
	DocumentValidationMessage,
	DocumentValidationRule,
} from "@knowledgeprism/constants";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ManualTextInput } from "./manual-text-input.js";

const FACTUAL_SENTENCE = "API tokens expire after 24 hours.";
const OVER_MAXIMUM_EXTRA_CHARACTERS = 1;
const SHORT_CONTENT = "test";

describe("ManualTextInput", () => {
	it("warns about short content before submit", async () => {
		const onSubmit = vi.fn();

		render(<ManualTextInput onCancel={vi.fn()} onSubmit={onSubmit} />);

		const content = screen.getByRole("textbox", { name: "Content" });
		const submit = screen.getByRole("button", {
			name: "Add to Knowledge Tree",
		});

		fireEvent.change(content, { target: { value: SHORT_CONTENT } });

		expect(
			screen.getByText(DocumentValidationMessage.CONTENT_TOO_SHORT),
		).toBeVisible();
		expect(submit).toBeDisabled();
		expect(onSubmit).not.toHaveBeenCalled();

		fireEvent.change(content, { target: { value: FACTUAL_SENTENCE } });

		await waitFor(() => {
			expect(
				screen.queryByText(DocumentValidationMessage.CONTENT_TOO_SHORT),
			).not.toBeInTheDocument();
		});

		fireEvent.click(submit);

		await waitFor(() => {
			expect(onSubmit).toHaveBeenCalledWith({
				content: FACTUAL_SENTENCE,
				title: "",
			});
		});
	});

	it("warns about content over the maximum before submit", () => {
		const onSubmit = vi.fn();
		const overMaximumContent = "a".repeat(
			DocumentValidationRule.CONTENT_MAXIMUM_LENGTH +
				OVER_MAXIMUM_EXTRA_CHARACTERS,
		);

		render(<ManualTextInput onCancel={vi.fn()} onSubmit={onSubmit} />);

		fireEvent.change(screen.getByRole("textbox", { name: "Content" }), {
			target: { value: overMaximumContent },
		});

		expect(
			screen.getByText(DocumentValidationMessage.CONTENT_MAXIMUM_LENGTH),
		).toBeVisible();
		expect(
			screen.getByRole("button", { name: "Add to Knowledge Tree" }),
		).toBeDisabled();
		expect(onSubmit).not.toHaveBeenCalled();
	});
});
