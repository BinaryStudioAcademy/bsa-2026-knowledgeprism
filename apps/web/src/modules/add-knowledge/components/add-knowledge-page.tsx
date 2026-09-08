import { type JSX, useCallback } from "react";

import { Alert, Button, Heading, Icon } from "~/components/components.js";
import { useAppDispatch, useAppSelector, useNavigate } from "~/hooks/hooks.js";
import { AppRoute } from "~/lib/enums/enums.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";
import { type ValueOf } from "~/lib/types/types.js";

import { actions } from "../add-knowledge.js";
import {
	DocumentProcessingStatus,
	KnowledgeInputTab,
	KnowledgeStep,
} from "../libs/enums/enums.js";
import { validateFile } from "../libs/helpers/helpers.js";
import { DestinationBadge } from "./destination-badge.js";
import { DocumentRow } from "./document-row.js";
import { FileDropzone } from "./file-dropzone.js";
import { IntegrationPreview } from "./integration-preview.js";
import { PasteTextPanel } from "./paste-text-panel.js";
import { TabHeader } from "./tab-header.js";
import { WebLinkPanel } from "./web-link-panel.js";

const AddKnowledgePage = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	const state = useAppSelector((rootState) => rootState.addKnowledge);
	const {
		currentStep,
		currentTab,
		destinationBranch,
		destinationProject,
		errorMessage,
		processingStatus,
		selectedFile,
	} = state;

	const handleClose = useCallback((): void => {
		dispatch(actions.resetState());
		void navigate(AppRoute.WORKSPACE);
	}, [dispatch, navigate]);

	const handleTabChange = useCallback(
		(tab: ValueOf<typeof KnowledgeInputTab>): void => {
			dispatch(actions.setCurrentTab(tab));
		},
		[dispatch],
	);

	const handleFileSelect = useCallback(
		(file: File): void => {
			const validation = validateFile(file);

			if (!validation.isValid) {
				dispatch(actions.setError(validation.error as string));
				return;
			}

			const id = crypto.randomUUID();
			dispatch(
				actions.startProcessing({ id, name: file.name, size: file.size }),
			);
			void dispatch(
				actions.processDocument({ id, name: file.name, size: file.size }),
			);
		},
		[dispatch],
	);

	const handleRetry = useCallback((): void => {
		if (!selectedFile) {
			return;
		}

		const { id, name, size } = selectedFile;
		dispatch(actions.startProcessing({ id, name, size }));
		void dispatch(actions.processDocument({ id, name, size }));
	}, [dispatch, selectedFile]);

	const handleRemove = useCallback((): void => {
		dispatch(actions.removeDocument());
	}, [dispatch]);

	const handleContinue = useCallback((): void => {
		dispatch(actions.setCurrentStep(KnowledgeStep.STEP_2));
	}, [dispatch]);

	const handleBackToInput = useCallback((): void => {
		dispatch(actions.setCurrentStep(KnowledgeStep.STEP_1));
	}, [dispatch]);

	const canContinue =
		processingStatus === DocumentProcessingStatus.SUCCESS &&
		selectedFile !== null;

	return (
		<div
			className={getValidClassNames(
				"fixed inset-0 z-50 flex items-center justify-center",
				"bg-[rgba(45,42,38,0.42)] p-4",
			)}
		>
			<div
				className={getValidClassNames(
					"flex max-h-[800px] w-full max-w-[600px] flex-col",
					"overflow-hidden rounded-[14px] bg-white",
					"shadow-[0_20px_48px_rgba(0,0,0,0.22)]",
				)}
			>
				{/* Modal Header */}
				<div className="flex items-center justify-between px-6.5 pt-5.5">
					<Heading level="3">Add Knowledge</Heading>
					<button
						aria-label="Close dialog"
						className={getValidClassNames(
							"flex size-7 cursor-pointer items-center justify-center",
							"rounded-md text-text-faint hover:text-text",
						)}
						onClick={handleClose}
						type="button"
					>
						<Icon name="close" size={14} />
					</button>
				</div>

				{/* Destination Pill */}
				<div className="px-6.5 pt-2 pb-4">
					<DestinationBadge
						branch={destinationBranch}
						project={destinationProject}
					/>
				</div>

				{/* Step 1 vs Step 2 Content */}
				{currentStep === KnowledgeStep.STEP_1 ? (
					<>
						<TabHeader activeTab={currentTab} onTabChange={handleTabChange} />

						<div className="flex-1 overflow-y-auto px-6.5 py-5.5">
							{errorMessage && (
								<div className="mb-4">
									<Alert
										description={errorMessage}
										title="Upload error"
										variant="error"
									/>
								</div>
							)}

							{currentTab === KnowledgeInputTab.UPLOAD && (
								<div className="flex flex-col gap-4">
									<FileDropzone
										disabled={Boolean(selectedFile)}
										onFileSelected={handleFileSelect}
									/>

									{selectedFile && (
										<DocumentRow
											item={selectedFile}
											onCancel={handleRemove}
											onRemove={handleRemove}
											onRetry={handleRetry}
										/>
									)}
								</div>
							)}

							{currentTab === KnowledgeInputTab.TEXT && <PasteTextPanel />}
							{currentTab === KnowledgeInputTab.LINK && <WebLinkPanel />}
						</div>

						{/* Modal Footer */}
						<div
							className={getValidClassNames(
								"flex items-center justify-between",
								"border-t border-border bg-bg px-6.5 py-4",
							)}
						>
							<span className="text-xs text-text-muted">
								{selectedFile ? "1 file ready" : "No files added yet"}
							</span>
							<div className="flex gap-2.5">
								<Button onClick={handleClose} variant="secondary">
									Cancel
								</Button>
								<Button disabled={!canContinue} onClick={handleContinue}>
									Continue
								</Button>
							</div>
						</div>
					</>
				) : (
					<div className="flex-1 overflow-y-auto px-6.5 py-6">
						<IntegrationPreview
							item={selectedFile}
							onBack={handleBackToInput}
							onComplete={handleClose}
						/>
					</div>
				)}
			</div>
		</div>
	);
};

export { AddKnowledgePage };
