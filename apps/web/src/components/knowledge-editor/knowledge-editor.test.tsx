import { type PartialBlock } from "@blocknote/core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { type JSX, useCallback } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { KnowledgeEditor } from "./knowledge-editor.js";
import { TextHighlightVariant } from "./libs/enums/enums.js";
import { type TextHighlight } from "./libs/types/types.js";

const HIGHLIGHT_TEXT = "application programming interface";
const HIGHLIGHT_ID = "glossary-1";

const createInitialContent = (): PartialBlock[] => [
	{ content: `Use the ${HIGHLIGHT_TEXT} here.`, type: "paragraph" },
];

const createHighlight = (): TextHighlight => ({
	id: HIGHLIGHT_ID,
	text: HIGHLIGHT_TEXT,
	variant: TextHighlightVariant.SUGGESTION,
});

const REPLACEMENT_TEXT = "API";

type ReplaceButtonProperties = {
	highlightId: string;
	replace: (replacement: string) => void;
};

const ReplaceButton = ({
	highlightId,
	replace,
}: ReplaceButtonProperties): JSX.Element => {
	const handleClick = useCallback(() => {
		replace(REPLACEMENT_TEXT);
	}, [replace]);

	return (
		<button onClick={handleClick} type="button">
			Replace {highlightId}
		</button>
	);
};

const renderTooltip = (
	highlightId: string,
	actions: { replace: (replacement: string) => void },
): JSX.Element => (
	<ReplaceButton highlightId={highlightId} replace={actions.replace} />
);

const getHighlightSpan = (): Element | null =>
	document.querySelector(
		`[data-text-highlight-id="${CSS.escape(HIGHLIGHT_ID)}"]`,
	);

const noop = (): void => {};

const createNoopMediaQueryList = (query: string): MediaQueryList =>
	({
		addEventListener: noop,
		addListener: noop,
		dispatchEvent: () => false,
		matches: false,
		media: query,
		onchange: null,
		removeEventListener: noop,
		removeListener: noop,
	}) as MediaQueryList;

// jsdom has no matchMedia; @blocknote/mantine's MantineProvider needs it to resolve the
// color scheme. Only this suite renders BlockNoteView, so the stub is scoped here.
beforeAll(() => {
	vi.stubGlobal("matchMedia", createNoopMediaQueryList);
});

describe("KnowledgeEditor highlights", () => {
	it("renders a span with the highlight id for a matching highlight", async () => {
		render(
			<KnowledgeEditor
				highlights={[createHighlight()]}
				initialContent={createInitialContent()}
			/>,
		);

		await waitFor(() => {
			expect(getHighlightSpan()).not.toBeNull();
		});
	});

	it("removes the highlight span when highlights change to an empty array", async () => {
		const { rerender } = render(
			<KnowledgeEditor
				highlights={[createHighlight()]}
				initialContent={createInitialContent()}
			/>,
		);

		await waitFor(() => {
			expect(getHighlightSpan()).not.toBeNull();
		});

		rerender(
			<KnowledgeEditor
				highlights={[]}
				initialContent={createInitialContent()}
			/>,
		);

		await waitFor(() => {
			expect(getHighlightSpan()).toBeNull();
		});
	});

	it("shows the tooltip when hovering over the highlight", async () => {
		render(
			<KnowledgeEditor
				highlights={[createHighlight()]}
				initialContent={createInitialContent()}
				renderHighlightTooltip={renderTooltip}
			/>,
		);

		const highlightSpan = await waitFor(() => {
			const span = getHighlightSpan();

			expect(span).not.toBeNull();

			return span as Element;
		});

		fireEvent.mouseOver(highlightSpan);

		expect(
			await screen.findByText(`Replace ${HIGHLIGHT_ID}`),
		).toBeInTheDocument();
	});

	it("replaces the highlighted text in an editable editor", async () => {
		render(
			<KnowledgeEditor
				highlights={[createHighlight()]}
				initialContent={createInitialContent()}
				renderHighlightTooltip={renderTooltip}
			/>,
		);

		const highlightSpan = await waitFor(() => {
			const span = getHighlightSpan();

			expect(span).not.toBeNull();

			return span as Element;
		});

		fireEvent.mouseOver(highlightSpan);

		const replaceButton = await screen.findByText(`Replace ${HIGHLIGHT_ID}`);

		fireEvent.click(replaceButton);

		await waitFor(() => {
			expect(screen.queryByText(HIGHLIGHT_TEXT, { exact: false })).toBeNull();
		});
		expect(
			screen.getByText(REPLACEMENT_TEXT, { exact: false }),
		).toBeInTheDocument();
	});
});
