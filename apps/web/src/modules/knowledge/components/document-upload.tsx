import { type JSX, useCallback, useEffect, useRef } from "react";

import { Alert } from "~/components/components.js";
import {
	useAppDispatch,
	useAppSelector,
	useCurrentProjectId,
} from "~/hooks/hooks.js";

import { actions } from "../knowledge.js";
import { validateFile } from "../libs/helpers/helpers.js";
import { DocumentRow } from "./document-row.js";
import { FileDropzone } from "./file-dropzone.js";

type Properties = {
	className?: string;
	isInteractionDisabled: boolean;
};

const DocumentUpload = ({
	className = "",
	isInteractionDisabled,
}: Properties): JSX.Element => {
	const dispatch = useAppDispatch();
	const projectId = useCurrentProjectId();
	const { errorMessage, selectedFile } = useAppSelector(
		(state) => state.knowledge,
	);
	const fileReference = useRef<File | null>(null);
	const uploadTaskReference = useRef<null | { abort: () => void }>(null);

	useEffect(() => {
		return () => {
			uploadTaskReference.current?.abort();
		};
	}, []);

	const handleFileSelect = useCallback(
		(file: File): void => {
			const validationResult = validateFile(file);

			if (!validationResult.isValid) {
				dispatch(actions.setError(validationResult.error ?? "Invalid file"));
				return;
			}

			dispatch(actions.clearError());
			fileReference.current = file;
			const id = `${file.name}-${String(Date.now())}`;
			dispatch(
				actions.startProcessing({ id, name: file.name, size: file.size }),
			);
			uploadTaskReference.current = dispatch(
				actions.processDocument({ file, id, projectId }),
			);
		},
		[dispatch, projectId],
	);

	const handleRetry = useCallback((): void => {
		if (isInteractionDisabled || !selectedFile || !fileReference.current) {
			return;
		}

		dispatch(
			actions.startProcessing({
				id: selectedFile.id,
				name: selectedFile.name,
				size: selectedFile.size,
			}),
		);
		uploadTaskReference.current = dispatch(
			actions.processDocument({
				documentId: selectedFile.documentId,
				file: fileReference.current,
				id: selectedFile.id,
				projectId,
				uploadUrl: selectedFile.uploadUrl,
			}),
		);
	}, [dispatch, isInteractionDisabled, projectId, selectedFile]);

	const handleRemove = useCallback((): void => {
		if (isInteractionDisabled) {
			return;
		}

		uploadTaskReference.current?.abort();
		dispatch(actions.removeDocument());
	}, [dispatch, isInteractionDisabled]);

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
					isDisabled={isInteractionDisabled}
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
