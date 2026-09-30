import { type GlossaryConsistencyMatchDto } from "@knowledgeprism/types";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TextHighlightVariant } from "~/components/knowledge-editor/libs/enums/enums.js";

import { GlossarySuggestions } from "./glossary-suggestions.js";

const MATCH: GlossaryConsistencyMatchDto = {
	canonicalName: "Client",
	explanation: "Refers to the client without using its canonical name.",
	matchedTermId: 1,
	sourceExcerpt: "the customer",
	suggestedText: "the Client",
};

describe("GlossarySuggestions", () => {
	it("offers Add to glossary instead of Keep for editor warnings", () => {
		const handleAddToGlossary = vi.fn();

		render(
			<GlossarySuggestions
				isChecking={false}
				matches={[MATCH]}
				onAccept={vi.fn()}
				onAddToGlossary={handleAddToGlossary}
				variant={TextHighlightVariant.WARNING}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Add to glossary" }));

		expect(handleAddToGlossary).toHaveBeenCalledWith(MATCH);
		expect(screen.queryByRole("button", { name: "Keep" })).toBeNull();
		expect(
			screen.getByText(
				"You can still save. A warning stays until the text is changed or the term is added to the glossary.",
			),
		).toBeInTheDocument();
	});

	it("keeps the Keep action for Integration Preview suggestions", () => {
		const handleKeep = vi.fn();

		render(
			<GlossarySuggestions
				isChecking={false}
				matches={[MATCH]}
				onAccept={vi.fn()}
				onKeep={handleKeep}
				variant={TextHighlightVariant.SUGGESTION}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Keep" }));

		expect(handleKeep).toHaveBeenCalledWith(MATCH);
		expect(
			screen.queryByRole("button", { name: "Add to glossary" }),
		).toBeNull();
	});
});
