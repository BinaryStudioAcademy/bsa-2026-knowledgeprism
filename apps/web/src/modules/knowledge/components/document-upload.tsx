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

const EMPTY_FILES_COUNT = 0;

const DocumentUpload = ({
	className = "",
	isInteractionDisabled,
}: Properties): JSX.Element => {
	const dispatch = useAppDispatch();
	const projectId = useCurrentProjectId();
	const { errorMessage, selectedFiles } = useAppSelector(
		(state) => state.knowledge,
	);
	const filesMapReference = useRef<Map<string, File>>(new Map());
	const uploadTasksReference = useRef<Map<string, { abort: () => void }>>(
		new Map(),
	);

	useEffect(() => {
		const uploadTasks = uploadTasksReference.current;
		const filesMap = filesMapReference.current;

		return () => {
			for (const task of uploadTasks.values()) {
				task.abort();
			}
			uploadTasks.clear();
			filesMap.clear();
		};
	}, []);

	const handleFilesSelect = useCallback(
		(files: File[]): void => {
			for (const file of files) {
				const validationResult = validateFile(file);

				if (!validationResult.isValid) {
					dispatch(actions.setError(validationResult.error ?? "Invalid file"));
					continue;
				}

				dispatch(actions.clearError());
				const id = `${file.name}-${String(file.lastModified)}-${String(Date.now())}`;
				filesMapReference.current.set(id, file);

				dispatch(
					actions.startProcessing({ id, name: file.name, size: file.size }),
				);

				const uploadTask = dispatch(
					actions.processDocument({ file, id, projectId }),
				);
				uploadTasksReference.current.set(id, uploadTask);
			}
		},
		[dispatch, projectId],
	);

	const handleRetry = useCallback(
		(id: string) => (): void => {
			const targetItem = selectedFiles.find((file) => file.id === id);
			const targetFile = filesMapReference.current.get(id);

			if (isInteractionDisabled || !targetItem || !targetFile) {
				return;
			}

			dispatch(
				actions.startProcessing({
					id: targetItem.id,
					name: targetItem.name,
					size: targetItem.size,
				}),
			);

			const uploadTask = dispatch(
				actions.processDocument({
					documentId: targetItem.documentId,
					file: targetFile,
					id: targetItem.id,
					projectId,
					uploadUrl: targetItem.uploadUrl,
				}),
			);
			uploadTasksReference.current.set(id, uploadTask);
		},
		[dispatch, isInteractionDisabled, projectId, selectedFiles],
	);

	const handleRemove = useCallback(
		(id: string) => (): void => {
			if (isInteractionDisabled) {
				return;
			}

			uploadTasksReference.current.get(id)?.abort();
			uploadTasksReference.current.delete(id);
			filesMapReference.current.delete(id);

			dispatch(actions.removeDocument({ id }));
		},
		[dispatch, isInteractionDisabled],
	);

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
				disabled={isInteractionDisabled}
				onFilesSelected={handleFilesSelect}
			/>

			{selectedFiles.length > EMPTY_FILES_COUNT && (
				<div className="flex flex-col gap-2">
					{selectedFiles.map((file) => (
						<DocumentRow
							isDisabled={isInteractionDisabled}
							item={file}
							key={file.id}
							onCancel={handleRemove(file.id)}
							onRemove={handleRemove(file.id)}
							onRetry={handleRetry(file.id)}
						/>
					))}
				</div>
			)}
		</div>
	);
};

export { DocumentUpload };
