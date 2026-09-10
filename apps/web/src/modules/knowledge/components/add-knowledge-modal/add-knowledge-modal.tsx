import { type JSX, useCallback, useState } from "react";

import { Button, Icon, Modal } from "~/components/components.js";
import { useAppSelector } from "~/hooks/hooks.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";
import { type ValueOf } from "~/lib/types/types.js";

import { DocumentProcessingStatus } from "../../libs/enums/enums.js";
import { DocumentUpload } from "../document-upload.js";
import { DestinationBadge } from "./destination-badge.js";
import { AddKnowledgeTab } from "./libs/enums/add-knowledge-tab.enum.js";

type GetCountLabelProperties = {
	hasSelectedFile: boolean;
	isReadyToAdd: boolean;
};

type Properties = {
	branchName?: string;
	isOpen: boolean;
	onClose: () => void;
	projectName?: string;
};

const TAB_ITEMS = [
	{
		iconName: "upload" as const,
		id: AddKnowledgeTab.UPLOAD,
		label: "Upload files",
	},
	{
		iconName: "paste-text" as const,
		id: AddKnowledgeTab.TEXT,
		label: "Paste text",
	},
	{
		iconName: "link" as const,
		id: AddKnowledgeTab.LINK,
		label: "Web link",
	},
];

const TAB_ICON_SIZE = 14;

const getCountLabel = ({
	hasSelectedFile,
	isReadyToAdd,
}: GetCountLabelProperties): string => {
	if (isReadyToAdd) {
		return "1 item ready";
	}

	if (hasSelectedFile) {
		return "Processing...";
	}

	return "No files added yet";
};

const AddKnowledgeModal = ({
	branchName = "Main",
	isOpen,
	onClose,
	projectName = "Project Alpha",
}: Properties): JSX.Element => {
	const [activeTab, setActiveTab] = useState<ValueOf<typeof AddKnowledgeTab>>(
		AddKnowledgeTab.UPLOAD,
	);
	const { selectedFile } = useAppSelector((state) => state.knowledge);

	const handleTabChange = useCallback(
		(tab: ValueOf<typeof AddKnowledgeTab>) => (): void => {
			setActiveTab(tab);
		},
		[],
	);

	const isReadyToAdd = Boolean(
		selectedFile &&
		(selectedFile.status === DocumentProcessingStatus.READY ||
			selectedFile.status === DocumentProcessingStatus.SUCCESS),
	);

	const countLabel = getCountLabel({
		hasSelectedFile: Boolean(selectedFile),
		isReadyToAdd,
	});

	return (
		<Modal
			hasCloseButton
			isOpen={isOpen}
			onClose={onClose}
			size="large"
			title="Add Knowledge"
		>
			<div className="flex flex-col">
				<div className="mb-4">
					<DestinationBadge branchName={branchName} projectName={projectName} />
				</div>

				<div className="mb-6 flex gap-6 border-b border-border">
					{TAB_ITEMS.map(({ iconName, id, label }) => {
						const isActive = activeTab === id;

						return (
							<button
								className={getValidClassNames(
									"-mb-px inline-flex cursor-pointer items-center gap-2 border-b-2 pb-2.5 pt-1 text-sm font-medium transition-colors",
									isActive
										? "border-accent text-accent"
										: "border-transparent text-text-muted hover:text-text",
								)}
								key={id}
								onClick={handleTabChange(id)}
								type="button"
							>
								<Icon name={iconName} size={TAB_ICON_SIZE} />
								<span>{label}</span>
							</button>
						);
					})}
				</div>

				<div>
					{activeTab === AddKnowledgeTab.UPLOAD && <DocumentUpload />}
					{activeTab === AddKnowledgeTab.TEXT && (
						<div className="flex flex-col items-center justify-center py-12 text-center text-sm text-text-muted">
							Paste text will be available soon.
						</div>
					)}
					{activeTab === AddKnowledgeTab.LINK && (
						<div className="flex flex-col items-center justify-center py-12 text-center text-sm text-text-muted">
							Web link will be available soon.
						</div>
					)}
				</div>

				<div className="-mx-7 -mb-7 mt-6 flex items-center justify-between border-t border-border bg-bg/50 px-7 py-4">
					<span className="text-xs text-text-muted">{countLabel}</span>
					<div className="flex items-center gap-3">
						<Button onClick={onClose} variant="ghost">
							Cancel
						</Button>
						<Button disabled={!isReadyToAdd} onClick={onClose}>
							Add to Knowledge Tree
						</Button>
					</div>
				</div>
			</div>
		</Modal>
	);
};

export { AddKnowledgeModal };
