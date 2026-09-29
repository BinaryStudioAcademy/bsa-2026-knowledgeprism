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
	const { selectedFiles, uploadErrorMessage, uploadSession } = useAppSelector(
		(state) => state.knowledge,
	);
	const uploadSessionId = uploadSession?.id;
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
			if (uploadSessionId === undefined) {
				return;
			}

			for (const [index, file] of files.entries()) {
				const validationResult = validateFile(file);

				if (!validationResult.isValid) {
					dispatch(
						actions.setUploadError(validationResult.error ?? "Invalid file"),
					);
					continue;
				}

				dispatch(actions.clearUploadError());
				const id = `${file.name}-${String(file.lastModified)}-${String(Date.now())}-${String(index)}`;
				filesMapReference.current.set(id, file);

				dispatch(
					actions.startProcessing({ id, name: file.name, size: file.size }),
				);

				const uploadTask = dispatch(
					actions.processDocument({ file, id, projectId, uploadSessionId }),
				);
				uploadTasksReference.current.set(id, uploadTask);
			}
		},
		[dispatch, projectId, uploadSessionId],
	);

	const handleRetry = useCallback(
		(id: string) => (): void => {
			const targetItem = selectedFiles.find((file) => file.id === id);
			const targetFile = filesMapReference.current.get(id);

			if (
				isInteractionDisabled ||
				!targetItem ||
				!targetFile ||
				uploadSessionId === undefined
			) {
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
					uploadSessionId,
					uploadUrl: targetItem.uploadUrl,
					uploadUrlExpiresAt: targetItem.uploadUrlExpiresAt,
				}),
			);
			uploadTasksReference.current.set(id, uploadTask);
		},
		[
			dispatch,
			isInteractionDisabled,
			projectId,
			selectedFiles,
			uploadSessionId,
		],
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
			{uploadErrorMessage && (
				<Alert
					description={uploadErrorMessage}
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
