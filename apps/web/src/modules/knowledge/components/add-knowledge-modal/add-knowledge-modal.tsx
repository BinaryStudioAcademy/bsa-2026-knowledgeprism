import { type JSX, useCallback, useState } from "react";

import { Icon, Modal } from "~/components/components.js";
import { useAppDispatch, useAppSelector } from "~/hooks/hooks.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";
import { type ValueOf } from "~/lib/types/types.js";

import { actions } from "../../knowledge.js";
import { DocumentProcessingStatus } from "../../libs/enums/enums.js";
import { DocumentUpload } from "../document-upload.js";
import { KnowledgeInputFooter } from "../knowledge-input-footer.js";
import { ManualTextInput } from "../manual-text-input/manual-text-input.js";
import { WebLinkInput } from "../web-link-input/web-link-input.js";
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
const FORM_SESSION_KEY_INCREMENT = 1;
const INITIAL_FORM_SESSION_KEY = 0;

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
	const dispatch = useAppDispatch();
	const [activeTab, setActiveTab] = useState<ValueOf<typeof AddKnowledgeTab>>(
		AddKnowledgeTab.UPLOAD,
	);
	const [formSessionKey, setFormSessionKey] = useState(
		INITIAL_FORM_SESSION_KEY,
	);

	const { selectedFile } = useAppSelector((state) => state.knowledge);

	const handleTabChange = useCallback(
		(tab: ValueOf<typeof AddKnowledgeTab>) => (): void => {
			setActiveTab(tab);
		},
		[],
	);

	const handleClose = useCallback((): void => {
		dispatch(actions.resetState());
		setActiveTab(AddKnowledgeTab.UPLOAD);
		setFormSessionKey((currentKey) => currentKey + FORM_SESSION_KEY_INCREMENT);
		onClose();
	}, [dispatch, onClose]);

	const handleManualTextSubmit = useCallback((): void => {
		handleClose();
	}, [handleClose]);

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
			contentClassName="flex min-h-0 flex-1 flex-col"
			hasCloseButton
			isFullScreenOnMobile
			isOpen={isOpen}
			onClose={handleClose}
			size="large"
			title="Add Knowledge"
		>
			<div className="flex min-h-0 flex-1 flex-col">
				<div className="mb-4 shrink-0">
					<DestinationBadge branchName={branchName} projectName={projectName} />
				</div>

				<div
					aria-label="Knowledge input type"
					className="mb-6 flex shrink-0 gap-6 border-b border-border"
					role="tablist"
				>
					{TAB_ITEMS.map(({ iconName, id, label }) => {
						const isActive = activeTab === id;

						return (
							<button
								aria-selected={isActive}
								className={getValidClassNames(
									"-mb-px inline-flex cursor-pointer items-center gap-2 border-b-2 pb-2.5 pt-1 text-sm font-medium transition-colors",
									isActive
										? "border-accent text-accent"
										: "border-transparent text-text-muted hover:text-text",
								)}
								key={id}
								onClick={handleTabChange(id)}
								role="tab"
								type="button"
							>
								<Icon name={iconName} size={TAB_ICON_SIZE} />
								<span>{label}</span>
							</button>
						);
					})}
				</div>

				<div className="min-h-0 flex-1" key={formSessionKey}>
					<div
						className={getValidClassNames(
							activeTab !== AddKnowledgeTab.UPLOAD && "hidden",
						)}
						role="tabpanel"
					>
						<DocumentUpload />

						<KnowledgeInputFooter
							isActionDisabled={!isReadyToAdd}
							onCancel={handleClose}
							onSubmit={handleClose}
							statusMessage={countLabel}
						/>
					</div>

					<div
						className={getValidClassNames(
							activeTab !== AddKnowledgeTab.TEXT && "hidden",
						)}
						role="tabpanel"
					>
						<ManualTextInput
							onCancel={handleClose}
							onSubmit={handleManualTextSubmit}
						/>
					</div>

					<div
						className={getValidClassNames(
							activeTab !== AddKnowledgeTab.LINK && "hidden",
						)}
						role="tabpanel"
					>
						<WebLinkInput onCancel={handleClose} onSubmit={handleClose} />
					</div>
				</div>
			</div>
		</Modal>
	);
};

export { AddKnowledgeModal };
