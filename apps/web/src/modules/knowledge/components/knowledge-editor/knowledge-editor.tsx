import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { type Block, type PartialBlock } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { useCallback } from "react";

type EditorTheme = "dark" | "light";

type Properties = {
	initialContent?: PartialBlock[];
	isEditable?: boolean;
	onChange?: (blocks: Block[]) => void;
	theme?: EditorTheme;
};

const KnowledgeEditor: React.FC<Properties> = ({
	initialContent,
	isEditable = true,
	onChange,
	theme = "light",
}: Properties) => {
	const editor = useCreateBlockNote(
		initialContent === undefined ? undefined : { initialContent },
		[initialContent],
	);
	// Workaround for BlockNote types with exactOptionalPropertyTypes enabled.
	// DefaultBlockSchema heading props are not compatible with BlockSchema constraints.
	// Context: https://github.com/TypeCellOS/BlockNote/discussions/2476.
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
