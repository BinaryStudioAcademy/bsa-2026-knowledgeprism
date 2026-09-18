import {
	type JSX,
	type KeyboardEvent,
	useCallback,
	useId,
	useRef,
	useState,
} from "react";

import { Icon, type IconName, Modal } from "~/components/components.js";
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
const FIRST_TAB_INDEX = 0;
const TAB_INDEX_STEP = 1;
const INACTIVE_TAB_INDEX = -1;

const getCountLabel = (
	status: undefined | ValueOf<typeof DocumentProcessingStatus>,
): string => {
	switch (status) {
		case DocumentProcessingStatus.FAILED: {
			return "Processing failed";
		}

		case DocumentProcessingStatus.PROCESSING: {
			return "Processing…";
		}

		case DocumentProcessingStatus.READY: {
			return "1 item ready";
		}

		default: {
			return "No files added yet";
		}
	}
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

	const tabIdPrefix = useId();
	const tabReferences = useRef(
		new Map<ValueOf<typeof AddKnowledgeTab>, HTMLButtonElement>(),
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

	const handleTabKeyDown = useCallback(
		(event: KeyboardEvent<HTMLButtonElement>): void => {
			const currentTabIndex = TAB_ITEMS.findIndex(
				(tab) => tab.id === activeTab,
			);

			let nextTabIndex: number;

			switch (event.key) {
				case "ArrowLeft": {
					nextTabIndex =
						(currentTabIndex - TAB_INDEX_STEP + TAB_ITEMS.length) %
						TAB_ITEMS.length;
					break;
				}

				case "ArrowRight": {
					nextTabIndex = (currentTabIndex + TAB_INDEX_STEP) % TAB_ITEMS.length;
					break;
				}

				case "End": {
					nextTabIndex = TAB_ITEMS.length - TAB_INDEX_STEP;
					break;
				}

				case "Home": {
					nextTabIndex = FIRST_TAB_INDEX;
					break;
				}

				default: {
					return;
				}
			}

			event.preventDefault();

			const nextTab = TAB_ITEMS[nextTabIndex];

			if (!nextTab) {
				return;
			}

			setActiveTab(nextTab.id);
			tabReferences.current.get(nextTab.id)?.focus();
		},
		[activeTab],
	);

	const isReadyToAdd = selectedFile?.status === DocumentProcessingStatus.READY;

	const countLabel = getCountLabel(selectedFile?.status);

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
								aria-controls={`${tabIdPrefix}-panel-${id}`}
								aria-selected={isActive}
								className={getValidClassNames(
									"-mb-px inline-flex cursor-pointer items-center gap-2 border-b-2 pb-2.5 pt-1 text-sm font-medium transition-colors",
									isActive
										? "border-accent text-accent"
										: "border-transparent text-text-muted hover:text-text",
								)}
								id={`${tabIdPrefix}-tab-${id}`}
								key={id}
								onClick={handleTabChange(id)}
								onKeyDown={handleTabKeyDown}
								ref={(element) => {
									if (element) {
										tabReferences.current.set(id, element);
									} else {
										tabReferences.current.delete(id);
									}
								}}
								role="tab"
								tabIndex={isActive ? FIRST_TAB_INDEX : INACTIVE_TAB_INDEX}
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
						aria-labelledby={`${tabIdPrefix}-tab-${AddKnowledgeTab.UPLOAD}`}
						className="flex flex-1 flex-col justify-between"
						hidden={activeTab !== AddKnowledgeTab.UPLOAD}
						id={`${tabIdPrefix}-panel-${AddKnowledgeTab.UPLOAD}`}
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
						aria-labelledby={`${tabIdPrefix}-tab-${AddKnowledgeTab.TEXT}`}
						className="flex flex-1 flex-col"
						hidden={activeTab !== AddKnowledgeTab.TEXT}
						id={`${tabIdPrefix}-panel-${AddKnowledgeTab.TEXT}`}
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
