import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

import "./knowledge-editor.css";

import {
	type Block,
	BlockNoteSchema,
	type BlockSchemaFromSpecs,
	type BlockSpecs,
	defaultBlockSpecs,
	type PartialBlock,
} from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import {
	DragHandleMenu,
	RemoveBlockItem,
	SideMenu,
	SideMenuController,
	type SideMenuProps,
	useCreateBlockNote,
	useExtension,
} from "@blocknote/react";
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
	disabledBlocks?: readonly EditorBlockType[];
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

const DEFAULT_DISABLED_BLOCKS: readonly EditorBlockType[] = [
	"table",
	"image",
	"video",
	"audio",
	"file",
] as const;

const getEditorBlockSpecs = (
	disabledBlocks: readonly EditorBlockType[] = DEFAULT_DISABLED_BLOCKS,
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

const getEditorSchema = (blockSpecs: BlockSpecs) => {
	return BlockNoteSchema.create({
		blockSpecs,
	});
};

const CustomDragHandleMenu: React.FC = () => (
	<DragHandleMenu>
		<RemoveBlockItem>Delete</RemoveBlockItem>
	</DragHandleMenu>
);

const CustomSideMenu: React.FC<SideMenuProps> = (properties: SideMenuProps) => (
	<SideMenu {...properties} dragHandleMenu={CustomDragHandleMenu} />
);

const KnowledgeEditor: React.FC<Properties> = ({
	disabledBlocks = DEFAULT_DISABLED_BLOCKS,
	highlights,
	initialContent,
	isEditable = true,
	onChange,
	onReady,
	renderHighlightTooltip,
	theme = "light",
}: Properties) => {
	const disabledBlocksKey = disabledBlocks.join(",");

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
		children?: ReactNode;
		editable: boolean;
		editor: typeof editor;
		onChange: () => void;
		sideMenu: boolean;
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
			sideMenu={false}
			theme={theme}
		>
			<SideMenuController sideMenu={CustomSideMenu} />
		</TypedBlockNoteView>
	);

	return (
		<div className="knowledge-editor w-full">
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
