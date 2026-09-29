import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import {
	type Block,
	BlockNoteSchema,
	type BlockSchemaFromSpecs,
	type BlockSpecs,
	defaultBlockSpecs,
	type PartialBlock,
} from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote, useExtension } from "@blocknote/react";
import { type ReactNode, useCallback, useEffect, useMemo } from "react";

import { HighlightTooltip } from "./libs/components/components.js";
import { textHighlightExtension } from "./libs/extensions/extensions.js";
import { type TextHighlight } from "./libs/types/types.js";

type EditorBlock = Block<BlockSchemaFromSpecs<BlockSpecs>>;

type EditorBlockType = Exclude<keyof typeof defaultBlockSpecs, "paragraph">;

type EditorTheme = "dark" | "light";

type KnowledgeEditorApi = {
	replace: (highlightId: string, replacement: string) => void;
};

type Properties = {
	disabledBlocks?: EditorBlockType[];
	highlights?: TextHighlight[];
	initialContent?: PartialBlock[];
	isEditable?: boolean;
	onChange?: (blocks: EditorBlock[]) => void;
	onReady?: (api: KnowledgeEditorApi) => void;
	renderHighlightTooltip?: (
		highlightId: string,
		actions: { replace: (replacement: string) => void },
	) => ReactNode;
	theme?: EditorTheme;
};

const getEditorBlockSpecs = (
	disabledBlocks: readonly EditorBlockType[] = [],
): BlockSpecs => {
	const disabledBlockSet = new Set<EditorBlockType>(disabledBlocks);

	return Object.fromEntries(
		Object.entries(defaultBlockSpecs).filter(([blockType]) => {
			return (
				blockType === "paragraph" ||
				!disabledBlockSet.has(blockType as EditorBlockType)
			);
		}),
	) as unknown as BlockSpecs;
};

// Workaround for BlockNote types with exactOptionalPropertyTypes enabled.
// DefaultBlockSchema heading props are not compatible with BlockSchema constraints.
// Context: https://github.com/TypeCellOS/BlockNote/discussions/2476.
const getEditorSchema = (blockSpecs: BlockSpecs) => {
	return BlockNoteSchema.create({
		blockSpecs,
	});
};

const KnowledgeEditor: React.FC<Properties> = ({
	disabledBlocks,
	highlights,
	initialContent,
	isEditable = true,
	onChange,
	onReady,
	renderHighlightTooltip,
	theme = "light",
}: Properties) => {
	const disabledBlocksKey = disabledBlocks?.join(",") ?? "";
	const editorSchema = useMemo(() => {
		const disabledBlockTypes =
			disabledBlocksKey === ""
				? []
				: (disabledBlocksKey.split(",") as EditorBlockType[]);

		return getEditorSchema(getEditorBlockSpecs(disabledBlockTypes));
	}, [disabledBlocksKey]);
	const editor = useCreateBlockNote(
		initialContent === undefined
			? { extensions: [textHighlightExtension()], schema: editorSchema }
			: {
					extensions: [textHighlightExtension()],
					initialContent,
					schema: editorSchema,
				},
		[initialContent, editorSchema],
	);
	const highlightExtension = useExtension(textHighlightExtension, { editor });
	const TypedBlockNoteView = BlockNoteView as unknown as React.FC<{
		editable: boolean;
		editor: typeof editor;
		onChange: () => void;
		theme: EditorTheme;
	}>;
	const handleEditorChange = useCallback((): void => {
		onChange?.(editor.document);
	}, [editor, onChange]);
	const handleReplace = useCallback(
		(highlightId: string, replacement: string): void => {
			highlightExtension.replaceHighlight(highlightId, replacement);
		},
		[highlightExtension],
	);

	useEffect(() => {
		highlightExtension.setHighlights(highlights ?? []);
	}, [highlightExtension, highlights]);

	useEffect(() => {
		onReady?.({ replace: handleReplace });
	}, [handleReplace, onReady]);

	const editorView = (
		<TypedBlockNoteView
			editable={isEditable}
			editor={editor}
			onChange={handleEditorChange}
			theme={theme}
		/>
	);

	return (
		<div className="w-full">
			{renderHighlightTooltip ? (
				<HighlightTooltip
					onReplace={handleReplace}
					renderTooltip={renderHighlightTooltip}
				>
					{editorView}
				</HighlightTooltip>
			) : (
				editorView
			)}
		</div>
	);
};

export { type KnowledgeEditorApi, KnowledgeEditor };
