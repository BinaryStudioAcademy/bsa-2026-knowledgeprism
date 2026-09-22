import { type JSX, useCallback, useState } from "react";

import { Icon, type IconName } from "~/components/icon/icon.js";
import { Modal } from "~/components/modal/modal.js";
import { useAppDispatch, useAppSelector } from "~/hooks/hooks.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";
import { type ValueOf } from "~/lib/types/types.js";

import { actions } from "../../knowledge.js";
import { DocumentProcessingStatus } from "../../libs/enums/enums.js";
import { DocumentUpload } from "../document-upload.js";
import { KnowledgeInputFooter } from "../knowledge-input-footer.js";
import { ManualTextInput } from "../manual-text-input/manual-text-input.js";
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

type TabItem = {
	iconName: IconName;
	id: ValueOf<typeof AddKnowledgeTab>;
	label: string;
};

const TAB_ITEMS: TabItem[] = [
	{
		iconName: "upload",
		id: AddKnowledgeTab.UPLOAD,
		label: "Upload files",
	},
	{
		iconName: "paste-text",
		id: AddKnowledgeTab.TEXT,
		label: "Paste text",
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

	const handleUploadSubmit = useCallback((): void => {
		// TODO: Add backend API call for document upload processing
		dispatch(actions.startAddingKnowledge());
		handleClose();
	}, [dispatch, handleClose]);

	const handleManualTextSubmit = useCallback((): void => {
		// TODO: Add backend API call for manual text processing
		dispatch(actions.startAddingKnowledge());
		handleClose();
	}, [dispatch, handleClose]);

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
			contentClassName="flex min-h-0 flex-1 flex-col pb-0 tablet:pb-0 desktop:pb-0"
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

				<div className="flex min-h-0 flex-1 flex-col" key={formSessionKey}>
					<div
						className={getValidClassNames(
							"flex flex-1 flex-col justify-between",
							activeTab !== AddKnowledgeTab.UPLOAD && "hidden",
						)}
						role="tabpanel"
					>
						<DocumentUpload />

						<KnowledgeInputFooter
							isActionDisabled={!isReadyToAdd}
							onCancel={handleClose}
							onSubmit={handleUploadSubmit}
							statusMessage={countLabel}
						/>
					</div>

					<div
						className={getValidClassNames(
							"flex flex-1 flex-col",
							activeTab !== AddKnowledgeTab.TEXT && "hidden",
						)}
						role="tabpanel"
					>
						<ManualTextInput
							onCancel={handleClose}
							onSubmit={handleManualTextSubmit}
						/>
					</div>
				</div>
			</div>
		</Modal>
	);
};

export { AddKnowledgeModal };
