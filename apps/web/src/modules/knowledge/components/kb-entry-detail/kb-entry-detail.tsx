import { type PartialBlock } from "@blocknote/core";
import { type SyntheticEvent, useCallback, useMemo, useState } from "react";
import { useController, useFormState, useWatch } from "react-hook-form";

import {
	Button,
	Input,
	KnowledgeEditor,
	Modal,
} from "~/components/components.js";
import { useAppForm } from "~/hooks/hooks.js";
import {
	type KbEntry,
	type KnowledgeEntryUpdateRequestDto,
} from "~/modules/knowledge/libs/types/types.js";

import { kbEntryValidationSchema } from "./libs/validation-schema.js";

const EMPTY_COUNT = 0;
const MAX_TITLE_CHARACTERS = 255;
const HTTP_STATUS_CONFLICT = 409;
const HTTP_STATUS_LOCKED = 423;

const DEFAULT_BLOCKS: PartialBlock[] = [
	{
		type: "paragraph",
	},
];

type TextNode = {
	text: string;
};

const isTextNode = (item: unknown): item is TextNode => {
	return typeof (item as Record<string, unknown>)["text"] === "string";
};

const extractPlainText = (content: unknown): string => {
	if (!content) {
		return "";
	}

	if (typeof content === "string") {
		const trimmed = content.trim();
		if (!trimmed.startsWith("[") && !trimmed.startsWith("{")) {
			return trimmed;
		}

		try {
			const parsed: unknown = JSON.parse(trimmed);
			return extractPlainText(parsed);
		} catch {
			return trimmed;
		}
	}

	if (!Array.isArray(content)) {
		return "";
	}

	return content
		.map((block: unknown) => {
			if (typeof block !== "object" || block === null) {
				return "";
			}

			const candidate = block as {
				children?: unknown;
				content?: unknown;
			};

			let text = "";

			if (Array.isArray(candidate.content)) {
				text = candidate.content
					.map((item: unknown) => {
						if (typeof item === "string") {
							return item;
						}
						if (isTextNode(item)) {
							return item.text;
						}
						return "";
					})
					.join("");
			} else if (typeof candidate.content === "string") {
				text = candidate.content;
			}

			const nested = Array.isArray(candidate.children)
				? extractPlainText(candidate.children)
				: "";

			return `${text} ${nested}`.trim();
		})
		.filter(Boolean)
		.join(" ");
};

const isBlockArray = (value: unknown): value is PartialBlock[] => {
	return Array.isArray(value);
};

const isBlockNoteEmpty = (document: unknown): boolean => {
	return extractPlainText(document).length === EMPTY_COUNT;
};

const parseInitialContent = (content?: unknown): PartialBlock[] => {
	if (!content) {
		return DEFAULT_BLOCKS;
	}
	if (isBlockArray(content)) {
		return content.length > EMPTY_COUNT ? content : DEFAULT_BLOCKS;
	}
	if (typeof content === "string") {
		try {
			const parsed: unknown = JSON.parse(content);
			if (isBlockArray(parsed) && parsed.length > EMPTY_COUNT) {
				return parsed;
			}
		} catch {
			return [
				{
					content,
					type: "paragraph",
				},
			];
		}
	}
	return DEFAULT_BLOCKS;
};

interface KbEntryFormProperties {
	entry: KbEntry;
	onCancel: () => void;
	onSave: (payload: KnowledgeEntryUpdateRequestDto) => Promise<boolean>;
	saveErrorMessage: null | string;
}

const KbEntryForm = ({
	entry,
	onCancel,
	onSave,
	saveErrorMessage,
}: KbEntryFormProperties) => {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isMaxTitleReached, setIsMaxTitleReached] = useState(false);

	const initialContent = useMemo(
		() => parseInitialContent(entry.content),
		[entry.content],
	);

	const initialBlocks = useMemo(
		() => initialContent as unknown as Record<string, unknown>[],
		[initialContent],
	);

	const { control, handleSubmit } = useAppForm<KnowledgeEntryUpdateRequestDto>({
		defaultValues: {
			contentJson: initialBlocks,
			title: entry.title,
		},
		mode: "onChange",
		validationSchema: kbEntryValidationSchema,
	});

	const { errors } = useFormState({ control });
	const currentTitle = useWatch({ control, name: "title" });
	const currentContentJson = useWatch({ control, name: "contentJson" });

	const {
		field: titleField,
		fieldState: { error: titleError },
	} = useController({ control, name: "title" });

	const {
		field: contentField,
		fieldState: { error: contentError },
	} = useController({ control, name: "contentJson" });

	const handleEditorChange = useCallback(
		(blocks: unknown): void => {
			contentField.onChange(blocks);
		},
		[contentField],
	);

	const handleValidSubmit = useCallback(
		async (values: KnowledgeEntryUpdateRequestDto): Promise<void> => {
			try {
				setIsSubmitting(true);
				const isSuccess = await onSave(values);

				if (isSuccess) {
					onCancel();
				}
			} finally {
				setIsSubmitting(false);
			}
		},
		[onCancel, onSave],
	);

	const handleFormSubmit = useCallback(
		(event_: React.BaseSyntheticEvent): void => {
			event_.preventDefault();
			void handleSubmit(handleValidSubmit)(event_);
		},
		[handleSubmit, handleValidSubmit],
	);

	const handleTitleInput = useCallback(
		(event: SyntheticEvent): void => {
			const target = event.target;
			if (!(target instanceof HTMLInputElement)) {
				return;
			}

			if (target.value.length >= MAX_TITLE_CHARACTERS) {
				setIsMaxTitleReached(true);
				if (target.value.length > MAX_TITLE_CHARACTERS) {
					const truncated = target.value.slice(
						EMPTY_COUNT,
						MAX_TITLE_CHARACTERS,
					);
					target.value = truncated;
					titleField.onChange(truncated);
				}
			} else {
				setIsMaxTitleReached(false);
			}
		},
		[titleField],
	);

	const isTitleEmpty = currentTitle.trim().length === EMPTY_COUNT;
	const isContentEmpty = isBlockNoteEmpty(currentContentJson);

	const hasFormErrors = Boolean(
		titleError || contentError || errors.title || errors.contentJson,
	);

	const isSaveDisabled =
		isSubmitting || isTitleEmpty || isContentEmpty || hasFormErrors;

	return (
		<form className="flex flex-col gap-4" onSubmit={handleFormSubmit}>
			<div className="kb-header flex justify-end gap-2 pb-4">
				<Button onClick={onCancel} type="button" variant="ghost">
					Cancel
				</Button>
				<Button disabled={isSaveDisabled} type="submit">
					Save
				</Button>
			</div>

			{saveErrorMessage && (
				<div className="rounded-md border border-error bg-error-bg p-3 text-sm text-error shadow-sm">
					{saveErrorMessage}
				</div>
			)}

			<div className="kb-body flex flex-col gap-4">
				<div className="flex flex-col gap-1" onInput={handleTitleInput}>
					<Input
						control={control}
						label="Event or club name"
						name="title"
						placeholder="Enter name..."
					/>
					{isMaxTitleReached && !titleError && (
						<span className="font-sans text-xs text-warning">
							Maximum length of 255 characters reached
						</span>
					)}
				</div>

				<div className="flex flex-col gap-2">
					<span
						className={`font-sans text-sm font-medium ${
							contentError || isContentEmpty ? "text-error" : "text-text"
						}`}
					>
						Description
					</span>
					<div
						className={`min-h-64 rounded-md border p-2 shadow-sm transition-colors ${
							contentError || isContentEmpty ? "border-error" : "border-border"
						}`}
					>
						<KnowledgeEditor
							initialContent={initialContent}
							onChange={handleEditorChange}
						/>
					</div>
					{contentError && (
						<span className="font-sans text-xs text-error">
							{contentError.message || "Description cannot be empty"}
						</span>
					)}
				</div>
			</div>
		</form>
	);
};

interface ConflictModalProperties {
	clientPayload: KnowledgeEntryUpdateRequestDto;
	onCancel: () => void;
	onResolve: (resolvedPayload: KnowledgeEntryUpdateRequestDto) => void;
	serverEntry: KbEntry;
}

const ConflictModal = ({
	clientPayload,
	onCancel,
	onResolve,
	serverEntry,
}: ConflictModalProperties) => {
	const [selectedVersion, setSelectedVersion] = useState<"client" | "server">(
		"client",
	);

	const serverContentString = useMemo(() => {
		if (typeof serverEntry.content === "string") {
			return serverEntry.content;
		}
		return JSON.stringify(serverEntry.content);
	}, [serverEntry.content]);

	const clientPreview = useMemo(() => {
		return extractPlainText(clientPayload.contentJson);
	}, [clientPayload.contentJson]);

	const serverPreview = useMemo(() => {
		return extractPlainText(serverContentString);
	}, [serverContentString]);

	const handleApply = useCallback((): void => {
		const isClientChosen = selectedVersion === "client";
		const serverBlocks = parseInitialContent(
			serverEntry.content,
		) as unknown as Record<string, unknown>[];

		onResolve({
			contentJson: isClientChosen ? clientPayload.contentJson : serverBlocks,
			title: isClientChosen ? clientPayload.title : serverEntry.title,
		});
	}, [
		clientPayload,
		onResolve,
		selectedVersion,
		serverEntry.content,
		serverEntry.title,
	]);

	const handleSelectServer = useCallback((): void => {
		setSelectedVersion("server");
	}, []);

	const handleSelectClient = useCallback((): void => {
		setSelectedVersion("client");
	}, []);

	return (
		<Modal
			hasCloseButton
			isOpen
			onClose={onCancel}
			size="large"
			title="Version Conflict (Optimistic Lock)"
		>
			<div className="flex flex-col gap-4">
				<p className="font-sans text-sm text-text-muted">
					Another user updated this entry while you were editing. Choose which
					version to apply:
				</p>

				<div className="flex flex-col gap-3">
					<button
						className={`cursor-pointer rounded-md border p-4 text-left transition-all ${
							selectedVersion === "server"
								? "border-accent bg-success-bg ring-1 ring-accent"
								: "border-border bg-surface hover:border-control-inactive"
						}`}
						onClick={handleSelectServer}
						type="button"
					>
						<div className="flex items-start gap-3">
							<div
								className={`mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
									selectedVersion === "server"
										? "border-accent bg-surface"
										: "border-control-inactive bg-transparent"
								}`}
							>
								{selectedVersion === "server" && (
									<div className="size-2 rounded-full bg-accent" />
								)}
							</div>

							<div className="flex flex-1 flex-col gap-2">
								<div className="flex items-center justify-between gap-2">
									<span className="font-sans text-sm font-semibold text-text">
										Server Version (v{serverEntry.version})
									</span>
									<span className="badge badge--muted shrink-0">
										Current in DB
									</span>
								</div>

								<div>
									<span className="font-sans text-2xs font-medium uppercase tracking-wider text-text-faint">
										Title
									</span>
									<p className="font-sans text-body font-medium text-text">
										{serverEntry.title}
									</p>
								</div>

								<div>
									<span className="font-sans text-2xs font-medium uppercase tracking-wider text-text-faint">
										Content
									</span>
									<div className="mt-1 max-h-24 overflow-y-auto rounded-sm bg-secondary p-2.5 font-sans text-xs leading-relaxed text-text-muted">
										{serverPreview || "No content"}
									</div>
								</div>
							</div>
						</div>
					</button>

					<button
						className={`cursor-pointer rounded-md border p-4 text-left transition-all ${
							selectedVersion === "client"
								? "border-accent bg-success-bg ring-1 ring-accent"
								: "border-border bg-surface hover:border-control-inactive"
						}`}
						onClick={handleSelectClient}
						type="button"
					>
						<div className="flex items-start gap-3">
							<div
								className={`mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
									selectedVersion === "client"
										? "border-accent bg-surface"
										: "border-control-inactive bg-transparent"
								}`}
							>
								{selectedVersion === "client" && (
									<div className="size-2 rounded-full bg-accent" />
								)}
							</div>

							<div className="flex flex-1 flex-col gap-2">
								<div className="flex items-center justify-between gap-2">
									<span className="font-sans text-sm font-semibold text-text">
										Your Version (Local changes)
									</span>
									<span className="badge badge--accent shrink-0">Draft</span>
								</div>

								<div>
									<span className="font-sans text-2xs font-medium uppercase tracking-wider text-text-faint">
										Title
									</span>
									<p className="font-sans text-body font-medium text-text">
										{clientPayload.title}
									</p>
								</div>

								<div>
									<span className="font-sans text-2xs font-medium uppercase tracking-wider text-text-faint">
										Content
									</span>
									<div className="mt-1 max-h-24 overflow-y-auto rounded-sm bg-secondary p-2.5 font-sans text-xs leading-relaxed text-text-muted">
										{clientPreview || "No content"}
									</div>
								</div>
							</div>
						</div>
					</button>
				</div>

				<div className="flex justify-end gap-2 border-t border-border-subtle pt-4">
					<Button onClick={onCancel} type="button" variant="ghost">
						Cancel
					</Button>
					<Button onClick={handleApply} type="button">
						Apply & Publish
					</Button>
				</div>
			</div>
		</Modal>
	);
};

interface KbEntryDetailProperties {
	canEdit: boolean;
	entry: KbEntry;
	onSave: (payload: KnowledgeEntryUpdateRequestDto) => Promise<void>;
}

const KbEntryDetail = ({ canEdit, entry, onSave }: KbEntryDetailProperties) => {
	const [isEditing, setIsEditing] = useState(false);
	const [isLockedByAi, setIsLockedByAi] = useState(false);
	const [saveErrorMessage, setSaveErrorMessage] = useState<null | string>(null);
	const [conflictData, setConflictData] = useState<null | {
		clientPayload: KnowledgeEntryUpdateRequestDto;
		serverEntry: KbEntry;
	}>(null);

	const readOnlyInitialContent = useMemo(
		() => parseInitialContent(entry.content),
		[entry.content],
	);

	const handleCancel = useCallback((): void => {
		setSaveErrorMessage(null);
		setIsEditing(false);
	}, []);

	const handleStartEdit = useCallback((): void => {
		setSaveErrorMessage(null);
		setIsEditing(true);
	}, []);

	const executeSave = useCallback(
		async (payload: KnowledgeEntryUpdateRequestDto): Promise<boolean> => {
			try {
				setSaveErrorMessage(null);
				await onSave(payload);
				return true;
			} catch (error: unknown) {
				const candidate = error as {
					message?: string;
					serverEntry?: KbEntry;
					status?: number;
				};

				if (candidate.status === HTTP_STATUS_LOCKED) {
					setIsLockedByAi(true);
					setIsEditing(false);
					return false;
				}

				if (
					candidate.status === HTTP_STATUS_CONFLICT ||
					candidate.serverEntry
				) {
					setConflictData({
						clientPayload: payload,
						serverEntry: candidate.serverEntry ?? {
							...entry,
							title: "Updated by another user on server",
						},
					});
					return false;
				}

				setSaveErrorMessage(
					candidate.message || "Failed to save changes. Please try again.",
				);
				return false;
			}
		},
		[entry, onSave],
	);

	const handleSave = useCallback(
		async (payload: KnowledgeEntryUpdateRequestDto): Promise<boolean> => {
			return await executeSave(payload);
		},
		[executeSave],
	);

	const handleCloseConflict = useCallback((): void => {
		setConflictData(null);
	}, []);

	const handleResolveConflict = useCallback(
		(resolvedPayload: KnowledgeEntryUpdateRequestDto): void => {
			void executeSave(resolvedPayload).then((isSuccess) => {
				if (!isSuccess) {
					return;
				}

				setConflictData(null);
				setIsEditing(false);
			});
		},
		[executeSave],
	);

	return (
		<div className="kb-container relative flex flex-col gap-4">
			{isLockedByAi && (
				<div className="flex items-center justify-between rounded-md border border-warning bg-warning-bg p-4 text-text shadow-sm">
					<div className="flex flex-col gap-0.5">
						<span className="font-sans text-body font-medium">
							Locked: AI is currently drafting an update for this page
						</span>
						<span className="font-sans text-xs text-text-muted">
							Editing is temporarily disabled to prevent overwriting AI
							suggestions.
						</span>
					</div>
					<span className="badge badge--muted">Read Only</span>
				</div>
			)}

			{conflictData && (
				<ConflictModal
					clientPayload={conflictData.clientPayload}
					onCancel={handleCloseConflict}
					onResolve={handleResolveConflict}
					serverEntry={conflictData.serverEntry}
				/>
			)}

			{isEditing && !isLockedByAi ? (
				<KbEntryForm
					entry={entry}
					key={entry.id}
					onCancel={handleCancel}
					onSave={handleSave}
					saveErrorMessage={saveErrorMessage}
				/>
			) : (
				<>
					{canEdit && !isLockedByAi && (
						<div className="kb-header flex justify-end pb-4">
							<Button onClick={handleStartEdit} type="button">
								Edit
							</Button>
						</div>
					)}
					<div className="kb-body">
						<h1 className="mb-4 text-2xl font-bold">{entry.title}</h1>

						<div className="-mx-12">
							<KnowledgeEditor
								initialContent={readOnlyInitialContent}
								isEditable={false}
								key={[entry.id, String(entry.version)].join("-")}
							/>
						</div>
					</div>
				</>
			)}
		</div>
	);
};

export { KbEntryDetail };
