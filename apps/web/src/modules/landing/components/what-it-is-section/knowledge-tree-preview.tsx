import { Icon } from "~/components/icon/icon.js";

import { FOLDER_ICON_SIZE, KNOWLEDGE_TREE_PREVIEW } from "./libs/constants.js";

const KNOWLEDGE_TREE_FOLDER_ROW_CLASS =
	"flex items-center gap-2 text-[13px] text-text-muted";

const KNOWLEDGE_TREE_CLASS = {
	ACTIVE_ITEM:
		"rounded-md bg-border-subtle px-2 py-1.5 text-[13px] font-medium text-text",
	CHROME: "border-b border-border-subtle px-4 py-3 text-[12.5px] font-medium",
	FOLDER_ROW: KNOWLEDGE_TREE_FOLDER_ROW_CLASS,
	FOLDER_ROW_LAST: `${KNOWLEDGE_TREE_FOLDER_ROW_CLASS} mt-1`,
	INACTIVE_ITEM: "px-2 py-1.5 text-[13px] text-text-muted",
	NESTED: "flex flex-col gap-1 pl-5",
	PREVIEW: "min-w-[320px] flex-1",
	ROOT: "flex w-full max-w-[460px] flex-col gap-0.5 overflow-hidden rounded-xl border border-border bg-surface",
	SECTION: "flex flex-col gap-1.5 px-4 py-3",
} as const;

const KnowledgeTreePreview: React.FC = () => (
	<div className={KNOWLEDGE_TREE_CLASS.PREVIEW}>
		<div className={KNOWLEDGE_TREE_CLASS.ROOT}>
			<div className={KNOWLEDGE_TREE_CLASS.CHROME}>
				{KNOWLEDGE_TREE_PREVIEW.TITLE}
			</div>
			<div className={KNOWLEDGE_TREE_CLASS.SECTION}>
				<div className={KNOWLEDGE_TREE_CLASS.FOLDER_ROW}>
					<Icon name="folder" size={FOLDER_ICON_SIZE} />
					{KNOWLEDGE_TREE_PREVIEW.FOLDERS.HARDWARE_SPECS}
				</div>
				<div className={KNOWLEDGE_TREE_CLASS.NESTED}>
					<div className={KNOWLEDGE_TREE_CLASS.ACTIVE_ITEM}>
						{KNOWLEDGE_TREE_PREVIEW.ITEMS.ACTIVE}
					</div>
					<div className={KNOWLEDGE_TREE_CLASS.INACTIVE_ITEM}>
						{KNOWLEDGE_TREE_PREVIEW.ITEMS.INACTIVE}
					</div>
				</div>
				<div className={KNOWLEDGE_TREE_CLASS.FOLDER_ROW_LAST}>
					<Icon name="folder" size={FOLDER_ICON_SIZE} />
					{KNOWLEDGE_TREE_PREVIEW.FOLDERS.SOFTWARE_INTEGRATION}
				</div>
			</div>
		</div>
	</div>
);

export { KnowledgeTreePreview };
