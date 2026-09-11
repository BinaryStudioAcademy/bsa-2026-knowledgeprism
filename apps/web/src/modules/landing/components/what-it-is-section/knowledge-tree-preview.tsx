import { Icon } from "~/components/icon/icon.js";

import { FOLDER_ICON_SIZE, KNOWLEDGE_TREE_PREVIEW } from "./libs/constants.js";

const KnowledgeTreePreview: React.FC = () => (
	<div className="min-w-[320px] flex-1">
		<div className="flex w-full max-w-[460px] flex-col gap-0.5 overflow-hidden rounded-xl border border-border bg-surface">
			<div className="border-b border-border-subtle px-4 py-3 text-[12.5px] font-medium">
				{KNOWLEDGE_TREE_PREVIEW.TITLE}
			</div>
			<div className="flex flex-col gap-1.5 px-4 py-3">
				<div className="flex items-center gap-2 text-[13px] text-text-muted">
					<Icon name="folder" size={FOLDER_ICON_SIZE} />
					{KNOWLEDGE_TREE_PREVIEW.FOLDERS.HARDWARE_SPECS}
				</div>
				<div className="flex flex-col gap-1 pl-5">
					<div className="rounded-md bg-border-subtle px-2 py-1.5 text-[13px] font-medium text-text">
						{KNOWLEDGE_TREE_PREVIEW.ITEMS.ACTIVE}
					</div>
					<div className="px-2 py-1.5 text-[13px] text-text-muted">
						{KNOWLEDGE_TREE_PREVIEW.ITEMS.INACTIVE}
					</div>
				</div>
				<div className="mt-1 flex items-center gap-2 text-[13px] text-text-muted">
					<Icon name="folder" size={FOLDER_ICON_SIZE} />
					{KNOWLEDGE_TREE_PREVIEW.FOLDERS.SOFTWARE_INTEGRATION}
				</div>
			</div>
		</div>
	</div>
);

export { KnowledgeTreePreview };
