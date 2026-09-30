import {
	DocumentValidationMessage,
	DocumentValidationRule,
} from "@knowledgeprism/constants";
import {
	type BaseSyntheticEvent,
	type JSX,
	useCallback,
	useEffect,
	useId,
	useRef,
	useState,
} from "react";
import { type Resolver, useForm, useWatch } from "react-hook-form";

import { Alert, Input, Textarea } from "~/components/components.js";

import { KnowledgeInputFooter } from "../knowledge-input-footer.js";

const FOCUS_TIMEOUT_DELAY = 0;
const MANUAL_TEXTAREA_ROWS = 8;
const TITLE_MAXIMUM_LENGTH = 255;

const ProcessingFailureMessage = {
	DESCRIPTION: "Please try again or cancel.",
	TITLE: "Processing failed",
} as const;

const ValidationMessage = {
	CONTENT_REQUIRED: "Content is required",
	TITLE_MAXIMUM_LENGTH: `Title must be at most ${TITLE_MAXIMUM_LENGTH.toString()} characters long`,
} as const;

type ManualTextInputPayload = {
	content: string;
	title: string;
};

const DEFAULT_MANUAL_TEXT_INPUT_PAYLOAD: ManualTextInputPayload = {
	content: "",
	title: "",
};

const getManualTextLengthWarning = (trimmedContent: string): null | string => {
	if (!trimmedContent) {
		return null;
	}

	if (
		trimmedContent.length <
		DocumentValidationRule.MANUAL_TEXT_CONTENT_MINIMUM_LENGTH
	) {
		return DocumentValidationMessage.CONTENT_TOO_SHORT;
	}

	if (trimmedContent.length > DocumentValidationRule.CONTENT_MAXIMUM_LENGTH) {
		return DocumentValidationMessage.CONTENT_MAXIMUM_LENGTH;
	}

	return null;
};

const resolveManualTextPayload = (
	payload: ManualTextInputPayload,
): ReturnType<Resolver<ManualTextInputPayload>> => {
	const content = payload.content.trim();
	const title = payload.title.trim();
	const isContentEmpty = !content;
	const isTitleTooLong = title.length > TITLE_MAXIMUM_LENGTH;

	if (!isContentEmpty && !isTitleTooLong) {
		return {
			errors: {},
			values: {
				content,
				title,
			},
		};
	}

	return {
		errors: {
			...(isContentEmpty && {
				content: {
					message: ValidationMessage.CONTENT_REQUIRED,
					type: "required",
				},
			}),
			...(isTitleTooLong && {
				title: {
					message: ValidationMessage.TITLE_MAXIMUM_LENGTH,
					type: "maxLength",
				},
			}),
		},
		values: {},
	};
};

type Properties = {
	isActive?: boolean;
	isLoading?: boolean;
	onCancel: () => void;
	onSubmit: (payload: ManualTextInputPayload) => Promise<void> | void;
};

const ManualTextInput = ({
	isActive = false,
	isLoading = false,
	onCancel,
	onSubmit,
}: Properties): JSX.Element => {
	const formId = useId();
	const resolveManualTextInput = useCallback<Resolver<ManualTextInputPayload>>(
		(payload) => {
			return resolveManualTextPayload(payload);
		},
		[],
	);

	const {
		control,
		formState: { isSubmitting },
		handleSubmit,
		setFocus,
	} = useForm<ManualTextInputPayload>({
		defaultValues: DEFAULT_MANUAL_TEXT_INPUT_PAYLOAD,
		mode: "onTouched",
		resolver: resolveManualTextInput,
	});

	useEffect(() => {
		if (!isActive) {
			return;
		}

		const timeoutId = setTimeout(() => {
			setFocus("title");
		}, FOCUS_TIMEOUT_DELAY);

		return (): void => {
			clearTimeout(timeoutId);
		};
	}, [isActive, setFocus]);

	const [hasProcessingFailed, setHasProcessingFailed] = useState(false);
	const isSubmissionPendingReference = useRef(false);

	const content = useWatch({
		control,
		name: "content",
	});

	const title = useWatch({
		control,
		name: "title",
	});

	const trimmedContent = content.trim();
	const contentLengthWarning = getManualTextLengthWarning(trimmedContent);
	const isTitleWithinLimit = title.trim().length <= TITLE_MAXIMUM_LENGTH;
	const canSubmitContent =
		Boolean(trimmedContent) &&
		contentLengthWarning === null &&
		isTitleWithinLimit;
	const isPayloadReady = canSubmitContent;
	const isProcessing = isLoading || isSubmitting;

	let statusMessage = "No knowledge added yet";

	if (isProcessing) {
		statusMessage = "Processing…";
	} else if (hasProcessingFailed) {
		statusMessage = ProcessingFailureMessage.TITLE;
	} else if (isPayloadReady) {
		statusMessage = "1 item ready";
	}

	const handleValidSubmit = useCallback(
		async (payload: ManualTextInputPayload): Promise<void> => {
			if (isLoading || isSubmissionPendingReference.current) {
				return;
			}

			isSubmissionPendingReference.current = true;
			setHasProcessingFailed(false);

			try {
				await onSubmit(payload);
			} catch {
				setHasProcessingFailed(true);
			} finally {
				isSubmissionPendingReference.current = false;
			}
		},
		[isLoading, onSubmit],
	);

	const handleFormSubmit = useCallback(
		(event: BaseSyntheticEvent): void => {
			if (contentLengthWarning) {
				event.preventDefault();

				return;
			}

			void handleSubmit(handleValidSubmit)(event);
		},
		[contentLengthWarning, handleSubmit, handleValidSubmit],
	);

	return (
		<form
			aria-busy={isProcessing}
			className="flex min-h-85 flex-col"
			id={formId}
			onSubmit={handleFormSubmit}
		>
			<fieldset
				className="m-0 flex min-w-0 flex-1 flex-col gap-3 border-0 p-0"
				disabled={isProcessing}
			>
				<Input
					control={control}
					label="Title"
					name="title"
					placeholder="e.g. Onboarding notes"
				/>

				<div className="flex flex-col gap-1">
					<Textarea
						className="min-h-45 leading-relaxed"
						control={control}
						label="Content"
						name="content"
						placeholder="Paste or type the knowledge you want Prism to learn…"
						rows={MANUAL_TEXTAREA_ROWS}
					/>
					{contentLengthWarning && (
						<span className="font-sans text-xs text-warning">
							{contentLengthWarning}
						</span>
					)}
				</div>

				{hasProcessingFailed && (
					<div role="alert">
						<Alert
							description={ProcessingFailureMessage.DESCRIPTION}
							title={ProcessingFailureMessage.TITLE}
							variant="error"
						/>
					</div>
				)}
			</fieldset>

			<KnowledgeInputFooter
				actionLabel={hasProcessingFailed ? "Retry" : "Add to Knowledge Tree"}
				formId={formId}
				hasActionIcon={!hasProcessingFailed}
				isActionDisabled={!canSubmitContent}
				isLoading={isProcessing}
				onCancel={onCancel}
				statusMessage={statusMessage}
			/>
		</form>
	);
};

export { ManualTextInput };
