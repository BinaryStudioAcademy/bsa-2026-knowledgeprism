import { type JSX, useCallback } from "react";

import { Alert } from "~/components/components.js";
import { useAppDispatch, useAppSelector } from "~/hooks/hooks.js";

import { actions } from "../knowledge.js";
import { validateFile } from "../libs/helpers/helpers.js";
import { DocumentRow } from "./document-row.js";
import { FileDropzone } from "./file-dropzone.js";

type Properties = {
	className?: string;
};

const DocumentUpload = ({ className = "" }: Properties): JSX.Element => {
	const dispatch = useAppDispatch();
	const { errorMessage, selectedFile } = useAppSelector(
		(state) => state.knowledge,
	);

	const handleFileSelect = useCallback(
		(file: File): void => {
			const validationResult = validateFile(file);

			if (!validationResult.isValid) {
				dispatch(actions.setError(validationResult.error ?? "Invalid file"));
				return;
			}

			dispatch(actions.clearError());
			const id = `${file.name}-${String(Date.now())}`;
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

		dispatch(
			actions.startProcessing({
				id: selectedFile.id,
				name: selectedFile.name,
				size: selectedFile.size,
			}),
		);
		void dispatch(
			actions.processDocument({
				id: selectedFile.id,
				name: selectedFile.name,
				size: selectedFile.size,
			}),
		);
	}, [dispatch, selectedFile]);

	const handleRemove = useCallback((): void => {
		dispatch(actions.removeDocument());
	}, [dispatch]);

	return (
		<div className={`flex flex-col gap-4 ${className}`}>
			{errorMessage && (
				<Alert
					description={errorMessage}
					title="Upload error"
					variant="error"
				/>
			)}

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
	);
};

export { DocumentUpload };
