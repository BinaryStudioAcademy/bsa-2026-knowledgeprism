import React, { useCallback, useRef, useState } from "react";

import { Icon } from "~/components/icon/icon.js";
import { UploadFileStatus } from "~/lib/enums/enums.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";
import { type ValueOf } from "~/lib/types/types.js";

const EMPTY_FILE_COUNT = 0;

type Properties = {
	files: UploadFile[];
	onFileRemove: (id: string) => void;
	onFilesSelected: (fileList: FileList) => void;
};
type UploadFile = {
	id: string;
	name: string;
	progress?: number;
	sizeLabel: string;
	status: UploadFileStatusValue;
};
type UploadFileStatusValue = ValueOf<typeof UploadFileStatus>;

const DEFAULT_UPLOAD_PROGRESS = 0;

const statusLabel: Record<UploadFileStatusValue, string> = {
	[UploadFileStatus.DONE]: "Ready",
	[UploadFileStatus.ERROR]: "Failed",
	[UploadFileStatus.UPLOADING]: "Uploading…",
};

const Upload: React.FC<Properties> = ({
	files,
	onFileRemove,
	onFilesSelected,
}: Properties) => {
	const [isDragActive, setIsDragActive] = useState(false);
	const inputReference = useRef<HTMLInputElement>(null);

	const handleDragOver = useCallback((event: React.DragEvent): void => {
		event.preventDefault();
		setIsDragActive(true);
	}, []);

	const handleDragLeave = useCallback((): void => {
		setIsDragActive(false);
	}, []);

	const handleDrop = useCallback(
		(event: React.DragEvent): void => {
			event.preventDefault();
			setIsDragActive(false);
			onFilesSelected(event.dataTransfer.files);
		},
		[onFilesSelected],
	);

	const handleFileInputChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>): void => {
			if (event.target.files) {
				onFilesSelected(event.target.files);
			}
		},
		[onFilesSelected],
	);

	const handleBrowseClick = useCallback((): void => {
		inputReference.current?.click();
	}, []);

	const handleRemoveClick = useCallback(
		(event: React.MouseEvent<HTMLButtonElement>): void => {
			const { fileId } = event.currentTarget.dataset;

			if (fileId) {
				onFileRemove(fileId);
			}
		},
		[onFileRemove],
	);

	return (
		<div className="flex flex-col gap-4">
			<div
				className={getValidClassNames(
					"flex flex-col items-center gap-2.5 rounded-xl border-[1.5px] border-dashed p-8 text-center transition-colors",
					{
						"border-accent bg-accent/10": isDragActive,
						"border-border": !isDragActive,
					},
				)}
				onDragLeave={handleDragLeave}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
			>
				<div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-accent/10 text-accent">
					<Icon name="upload" size={18} />
				</div>
				<div className="text-sm font-medium">
					Drag files here, or{" "}
					<button
						className="cursor-pointer border-none bg-transparent p-0 text-sm font-medium text-accent underline"
						onClick={handleBrowseClick}
						type="button"
					>
						browse
					</button>
				</div>
				<div className="text-xs text-text-faint">
					PDF, DOCX, TXT, MD, CSV · up to 25MB each
				</div>
				<input
					className="hidden"
					multiple
					onChange={handleFileInputChange}
					ref={inputReference}
					type="file"
				/>
			</div>

			<div className="flex flex-col gap-2">
				{files.map((file) => {
					const progress = file.progress ?? DEFAULT_UPLOAD_PROGRESS;

					return (
						<div
							className="flex items-center gap-2.5 rounded-[10px] border border-border bg-surface p-3"
							key={file.id}
						>
							<div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
								<Icon name="file" size={14} />
							</div>
							<div className="min-w-0 flex-1">
								<div className="truncate text-sm font-medium">{file.name}</div>
								<div className="mt-0.5 text-xs text-text-faint">
									{file.sizeLabel} · {statusLabel[file.status]}
								</div>
								{file.status === UploadFileStatus.UPLOADING && (
									<div className="mt-1.5 h-[3px] overflow-hidden rounded-full bg-border-subtle">
										<div
											className="h-full rounded-full bg-accent transition-[width]"
											style={{ width: `${String(progress)}%` }}
										/>
									</div>
								)}
							</div>
							<button
								aria-label={`Remove ${file.name}`}
								className="flex-shrink-0 text-text-faint hover:text-text-muted"
								data-file-id={file.id}
								onClick={handleRemoveClick}
								type="button"
							>
								<Icon name="close" size={13} />
							</button>
						</div>
					);
				})}
				{files.length === EMPTY_FILE_COUNT && (
					<div className="py-2.5 text-center text-xs text-text-faint">
						No files added yet
					</div>
				)}
			</div>
		</div>
	);
};

export { Upload };
export { type UploadFile };
