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
import { useCreateBlockNote } from "@blocknote/react";
import { useCallback, useMemo } from "react";

type EditorBlock = Block<BlockSchemaFromSpecs<BlockSpecs>>;

type EditorBlockType = Exclude<keyof typeof defaultBlockSpecs, "paragraph">;

type EditorTheme = "dark" | "light";

type Properties = {
	disabledBlocks?: EditorBlockType[];
	initialContent?: PartialBlock[];
	isEditable?: boolean;
	onChange?: (blocks: EditorBlock[]) => void;
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
	initialContent,
	isEditable = true,
	onChange,
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
			? { schema: editorSchema }
			: { initialContent, schema: editorSchema },
		[initialContent, editorSchema],
	);
	const TypedBlockNoteView = BlockNoteView as unknown as React.FC<{
		editable: boolean;
		editor: typeof editor;
		onChange: () => void;
		theme: EditorTheme;
	}>;
	const handleEditorChange = useCallback((): void => {
		onChange?.(editor.document);
	}, [editor, onChange]);

	return (
		<div className="w-full">
			<TypedBlockNoteView
				editable={isEditable}
				editor={editor}
				onChange={handleEditorChange}
				theme={theme}
			/>
		</div>
	);
};

export { KnowledgeEditor };
