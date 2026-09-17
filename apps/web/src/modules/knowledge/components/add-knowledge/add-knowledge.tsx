import {
	type ChangeEvent,
	type DragEvent,
	type SyntheticEvent,
	useCallback,
	useState,
} from "react";

import {
	Button,
	Heading,
	Paragraph,
	ParagraphSize,
} from "~/components/components.js";
import { Icon } from "~/components/icon/icon.js";
import { useNavigate } from "~/hooks/hooks.js";
import { AppRoute } from "~/lib/enums/enums.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";

const DEFAULT_FILE_INDEX = 0;
const EMPTY_LENGTH = 0;

type AddKnowledgeProperties = {
	onStartProcessing?: (payload: { file?: File; text?: string }) => void;
	userRole?: string;
};

type TabMode = "manual" | "upload";

const AddKnowledge: React.FC<AddKnowledgeProperties> = ({
	onStartProcessing,
	userRole = "EDITOR",
}: AddKnowledgeProperties) => {
	const navigate = useNavigate();

	const [activeTab, setActiveTab] = useState<TabMode>("upload");
	const [file, setFile] = useState<File | null>(null);
	const [text, setText] = useState<string>("");
	const [isDragging, setIsDragging] = useState<boolean>(false);

	const isViewer = userRole.toUpperCase() === "VIEWER";

	const handleFileSelect = useCallback((selectedFile: File): void => {
		const isSupported =
			selectedFile.type === "application/pdf" ||
			selectedFile.name.endsWith(".txt") ||
			selectedFile.type === "text/plain";

		if (isSupported) {
			setFile(selectedFile);
		}
	}, []);

	const handleInputChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>): void => {
			const selectedFile = event.target.files?.item(DEFAULT_FILE_INDEX);
			if (selectedFile) {
				handleFileSelect(selectedFile);
			}
		},
		[handleFileSelect],
	);

	const handleDrop = useCallback(
		(event: DragEvent<HTMLDivElement>): void => {
			event.preventDefault();
			setIsDragging(false);
			const droppedFile = event.dataTransfer.files.item(DEFAULT_FILE_INDEX);
			if (droppedFile) {
				handleFileSelect(droppedFile);
			}
		},
		[handleFileSelect],
	);

	const handleDragOver = useCallback(
		(event: DragEvent<HTMLDivElement>): void => {
			event.preventDefault();
			setIsDragging(true);
		},
		[],
	);

	const handleDragLeave = useCallback((): void => {
		setIsDragging(false);
	}, []);

	const handleTextChange = useCallback(
		(event: ChangeEvent<HTMLTextAreaElement>): void => {
			setText(event.target.value);
		},
		[],
	);

	const handleRemoveFile = useCallback((): void => {
		setFile(null);
	}, []);

	const handleSelectUploadTab = useCallback((): void => {
		setActiveTab("upload");
	}, []);

	const handleSelectManualTab = useCallback((): void => {
		setActiveTab("manual");
	}, []);

	const handleCancel = useCallback((): void => {
		void navigate(AppRoute.KNOWLEDGE_TREE);
	}, [navigate]);

	const handleSubmit = useCallback(
		(event: SyntheticEvent): void => {
			event.preventDefault();

			if (activeTab === "upload") {
				if (file) {
					onStartProcessing?.({ file });
					void navigate(AppRoute.KNOWLEDGE_TREE);
				}

				return;
			}

			const trimmedText = text.trim();
			if (trimmedText.length > EMPTY_LENGTH) {
				onStartProcessing?.({ text: trimmedText });
				void navigate(AppRoute.KNOWLEDGE_TREE);
			}
		},
		[activeTab, file, navigate, onStartProcessing, text],
	);

	if (isViewer) {
		return null;
	}

	const isSubmitDisabled =
		activeTab === "upload" ? !file : text.trim().length === EMPTY_LENGTH;

	return (
		<div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
			<div>
				<Heading level="1">Add Knowledge</Heading>
				<Paragraph className="text-text-muted" size={ParagraphSize.BODY_SMALL}>
					Upload a document or enter text to expand your project knowledge base.
				</Paragraph>
			</div>

			<div className="flex border-b border-border">
				<button
					className={getValidClassNames(
						"border-b-2 px-4 py-2 text-sm font-medium transition-colors",
						activeTab === "upload"
							? "border-accent text-accent"
							: "border-transparent text-text-muted hover:text-text",
					)}
					onClick={handleSelectUploadTab}
					type="button"
				>
					Upload document
				</button>
				<button
					className={getValidClassNames(
						"border-b-2 px-4 py-2 text-sm font-medium transition-colors",
						activeTab === "manual"
							? "border-accent text-accent"
							: "border-transparent text-text-muted hover:text-text",
					)}
					onClick={handleSelectManualTab}
					type="button"
				>
					Manual text input
				</button>
			</div>

			<form className="flex flex-col gap-6" onSubmit={handleSubmit}>
				{activeTab === "upload" ? (
					<div
						className={getValidClassNames(
							"flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center transition-colors",
							isDragging
								? "border-accent bg-accent/5"
								: "border-border hover:border-border-hover",
						)}
						onDragLeave={handleDragLeave}
						onDragOver={handleDragOver}
						onDrop={handleDrop}
					>
						<input
							accept=".pdf,.txt,text/plain,application/pdf"
							className="hidden"
							id="file-upload"
							onChange={handleInputChange}
							type="file"
						/>
						<label
							className="flex cursor-pointer flex-col items-center gap-2"
							htmlFor="file-upload"
						>
							<div className="flex size-10 items-center justify-center rounded-full bg-surface-subtle text-accent">
								<Icon name="plus" size={20} />
							</div>
							<Paragraph
								className="font-medium"
								size={ParagraphSize.BODY_SMALL}
							>
								Drag & drop your file here, or browse
							</Paragraph>
							<Paragraph
								className="text-text-faint"
								size={ParagraphSize.BODY_SMALL}
							>
								Supported formats: PDF, TXT (One file per upload)
							</Paragraph>
						</label>

						{file && (
							<div className="mt-4 flex items-center gap-2 rounded bg-surface-subtle px-3 py-1.5 text-sm">
								<span className="font-medium text-text">{file.name}</span>
								<button
									className="text-text-muted hover:text-error"
									onClick={handleRemoveFile}
									type="button"
								>
									<Icon name="close" size={14} />
								</button>
							</div>
						)}
					</div>
				) : (
					<div className="flex flex-col gap-2">
						<textarea
							className="min-h-56 w-full rounded-md border border-border bg-surface p-3 text-sm focus:border-accent focus:outline-none"
							onChange={handleTextChange}
							placeholder="Write or paste your knowledge text here..."
							value={text}
						/>
					</div>
				)}

				<div className="flex justify-end gap-3">
					<Button onClick={handleCancel} variant="secondary">
						Cancel
					</Button>
					<Button disabled={isSubmitDisabled} type="submit" variant="primary">
						Process
					</Button>
				</div>
			</form>
		</div>
	);
};

export { AddKnowledge };
