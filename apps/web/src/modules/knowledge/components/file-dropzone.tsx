import { FileValidationRule } from "@knowledgeprism/constants";
import {
	type ChangeEvent,
	type DragEvent,
	type JSX,
	useCallback,
	useRef,
	useState,
} from "react";

import { Icon } from "~/components/components.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";

import { SUPPORTED_FILE_EXTENSIONS } from "../libs/constants/constants.js";

const EMPTY_FILES_COUNT = 0;

type Properties = {
	disabled?: boolean;
	onFilesSelected: (files: File[]) => void;
};

const FileDropzone = ({
	disabled = false,
	onFilesSelected,
}: Properties): JSX.Element => {
	const [isDragActive, setIsDragActive] = useState(false);
	const fileInputReference = useRef<HTMLInputElement>(null);

	const handleDragOver = useCallback(
		(event: DragEvent<HTMLDivElement>): void => {
			event.preventDefault();
			if (!disabled) {
				setIsDragActive(true);
			}
		},
		[disabled],
	);

	const handleDragLeave = useCallback(
		(event: DragEvent<HTMLDivElement>): void => {
			event.preventDefault();
			setIsDragActive(false);
		},
		[],
	);

	const handleDrop = useCallback(
		(event: DragEvent<HTMLDivElement>): void => {
			event.preventDefault();
			setIsDragActive(false);

			if (disabled) {
				return;
			}

			const droppedFiles = [...event.dataTransfer.files];
			if (droppedFiles.length > EMPTY_FILES_COUNT) {
				onFilesSelected(droppedFiles);
			}
		},
		[disabled, onFilesSelected],
	);

	const handleBrowseClick = useCallback((): void => {
		fileInputReference.current?.click();
	}, []);

	const handleInputChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>): void => {
			const selectedFiles = event.target.files ? [...event.target.files] : [];

			if (selectedFiles.length > EMPTY_FILES_COUNT) {
				onFilesSelected(selectedFiles);
			}
			event.target.value = "";
		},
		[onFilesSelected],
	);

	return (
		<div
			className={getValidClassNames(
				"flex flex-col items-center justify-center gap-2.5",
				"rounded-xl border-2 border-dashed p-8 text-center transition-colors",
				isDragActive
					? "border-accent bg-accent/5"
					: "border-border bg-bg hover:border-accent/60",
				disabled && "cursor-not-allowed opacity-50",
			)}
			onDragLeave={handleDragLeave}
			onDragOver={handleDragOver}
			onDrop={handleDrop}
		>
			<div className="flex size-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
				<Icon name="upload" size={20} />
			</div>

			<div className="text-[13.5px] font-medium text-text">
				Drag files here, or{" "}
				<button
					className="cursor-pointer font-medium text-accent underline hover:text-accent-hover disabled:cursor-not-allowed disabled:text-text-faint"
					disabled={disabled}
					onClick={handleBrowseClick}
					type="button"
				>
					browse
				</button>
			</div>

			<div className="text-xs text-text-muted">
				{SUPPORTED_FILE_EXTENSIONS.map((extension) =>
					extension.replace(".", "").toUpperCase(),
				).join(", ")}{" "}
				• up to {FileValidationRule.MAXIMUM_FILE_SIZE_IN_MB}MB each
			</div>

			<input
				accept={SUPPORTED_FILE_EXTENSIONS.join(",")}
				className="hidden"
				disabled={disabled}
				multiple
				onChange={handleInputChange}
				ref={fileInputReference}
				type="file"
			/>
		</div>
	);
};

export { FileDropzone };
