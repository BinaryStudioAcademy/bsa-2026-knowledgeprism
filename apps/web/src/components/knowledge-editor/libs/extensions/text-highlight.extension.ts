import { createExtension } from "@blocknote/core";
import { type Node as ProseMirrorNode } from "prosemirror-model";
import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

import { TextHighlightVariant } from "../enums/enums.js";
import { findTextHighlightRanges } from "../helpers/find-text-highlight-ranges.helper.js";
import { type TextHighlight, type TextHighlightRange } from "../types/types.js";

const TEXT_HIGHLIGHT_EXTENSION_KEY = "textHighlight";

const textHighlightVariantClassName: Record<TextHighlight["variant"], string> =
	{
		[TextHighlightVariant.SUGGESTION]:
			"rounded-sm bg-accent/15 underline decoration-accent decoration-dotted underline-offset-2 cursor-help",
		[TextHighlightVariant.WARNING]:
			"rounded-sm bg-warning-bg underline decoration-warning decoration-wavy underline-offset-2 cursor-help",
	};

type TextHighlightPluginState = {
	decorations: DecorationSet;
	highlights: TextHighlight[];
	ranges: TextHighlightRange[];
};

const textHighlightPluginKey = new PluginKey<TextHighlightPluginState>(
	TEXT_HIGHLIGHT_EXTENSION_KEY,
);

const computeTextHighlightPluginState = (
	document_: ProseMirrorNode,
	highlights: TextHighlight[],
): TextHighlightPluginState => {
	const ranges = findTextHighlightRanges(document_, highlights);
	const decorations = DecorationSet.create(
		document_,
		ranges.map((range) =>
			Decoration.inline(range.from, range.to, {
				class: textHighlightVariantClassName[range.variant],
				"data-text-highlight-id": range.id,
			}),
		),
	);

	return { decorations, highlights, ranges };
};

const textHighlightExtension = createExtension((extensionContext) => {
	const { editor } = extensionContext;

	const plugin = new Plugin<TextHighlightPluginState>({
		key: textHighlightPluginKey,
		props: {
			decorations: (state) =>
				textHighlightPluginKey.getState(state)?.decorations,
		},
		state: {
			apply: (transaction, value, ...editorStates) => {
				const [, newState] = editorStates;
				const metaHighlights = transaction.getMeta(textHighlightPluginKey) as
					TextHighlight[] | undefined;

				if (metaHighlights) {
					return computeTextHighlightPluginState(newState.doc, metaHighlights);
				}

				if (transaction.docChanged) {
					return computeTextHighlightPluginState(
						newState.doc,
						value.highlights,
					);
				}

				return value;
			},
			init: (_config, state) => computeTextHighlightPluginState(state.doc, []),
		},
	});

	const getRange = (id: string): null | { from: number; to: number } => {
		const range = textHighlightPluginKey
			.getState(editor.prosemirrorState)
			?.ranges.find((existingRange) => existingRange.id === id);

		return range ? { from: range.from, to: range.to } : null;
	};

	const replaceHighlight = (id: string, replacement: string): void => {
		const range = getRange(id);

		if (!range) {
			return;
		}

		editor.transact((transaction) =>
			transaction.insertText(replacement, range.from, range.to),
		);
	};

	const setHighlights = (highlights: TextHighlight[]): void => {
		editor.transact((transaction) =>
			transaction
				.setMeta(textHighlightPluginKey, highlights)
				.setMeta("addToHistory", false),
		);
	};

	return {
		getRange,
		key: TEXT_HIGHLIGHT_EXTENSION_KEY,
		prosemirrorPlugins: [plugin],
		replaceHighlight,
		setHighlights,
	};
});

export { textHighlightExtension };
