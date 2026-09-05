import { Icon } from "~/components/icon/icon.js";

import {
	FOLDER_ICON_SIZE,
	KNOWLEDGE_TREE_CLASS,
	KNOWLEDGE_TREE_PREVIEW,
} from "./libs/constants.js";

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
