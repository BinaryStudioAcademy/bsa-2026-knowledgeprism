import {
	type BaseSyntheticEvent,
	type JSX,
	useCallback,
	useRef,
	useState,
} from "react";
import { type Resolver, useForm, useWatch } from "react-hook-form";

import {
	Alert,
	Button,
	Icon,
	Input,
	Textarea,
} from "~/components/components.js";

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

const ACTION_ICON_SIZE = 9;

const resolveManualTextInput: Resolver<ManualTextInputPayload> = (payload) => {
	const isContentEmpty = !payload.content.trim();
	const isTitleTooLong = payload.title.length > TITLE_MAXIMUM_LENGTH;

	if (!isContentEmpty && !isTitleTooLong) {
		return {
			errors: {},
			values: payload,
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
	isLoading?: boolean;
	onCancel: () => void;
	onSubmit: (payload: ManualTextInputPayload) => Promise<void> | void;
};

const ManualTextInput = ({
	isLoading = false,
	onCancel,
	onSubmit,
}: Properties): JSX.Element => {
	const {
		control,
		formState: { isSubmitting },
		handleSubmit,
	} = useForm<ManualTextInputPayload>({
		defaultValues: DEFAULT_MANUAL_TEXT_INPUT_PAYLOAD,
		mode: "onTouched",
		resolver: resolveManualTextInput,
	});

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

	const isPayloadReady =
		Boolean(content.trim()) && title.length <= TITLE_MAXIMUM_LENGTH;
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
			void handleSubmit(handleValidSubmit)(event);
		},
		[handleSubmit, handleValidSubmit],
	);

	return (
		<form
			aria-busy={isProcessing}
			className="flex min-h-85 flex-col"
			onSubmit={handleFormSubmit}
		>
			<fieldset
				className="m-0 flex min-w-0 flex-1 flex-col gap-3 border-0 px-6 py-5 max-sm:px-4"
				disabled={isProcessing}
			>
				<Input
					control={control}
					label="Title"
					name="title"
					placeholder="e.g. Onboarding notes"
				/>

				<Textarea
					className="min-h-45 leading-relaxed"
					control={control}
					label="Content"
					name="content"
					placeholder="Paste or type the knowledge you want Prism to learn…"
					rows={MANUAL_TEXTAREA_ROWS}
				/>

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

			<div className="flex items-center justify-between gap-4 border-t border-border bg-bg px-6 py-4 max-sm:px-4">
				<span
					aria-live="polite"
					className="text-sm text-text-muted max-sm:hidden"
				>
					{statusMessage}
				</span>

				<div className="flex gap-2 max-sm:w-full">
					<Button
						className={hasProcessingFailed ? "max-sm:flex-1" : "max-sm:hidden"}
						disabled={isProcessing}
						onClick={onCancel}
						variant="ghost"
					>
						Cancel
					</Button>

					<Button
						className="enabled:!bg-accent enabled:hover:!bg-accent-hover max-sm:flex-1"
						disabled={!isPayloadReady}
						isLoading={isProcessing}
						type="submit"
					>
						<span className="inline-flex items-center gap-2">
							{!hasProcessingFailed && !isProcessing && (
								<span aria-hidden="true" className="inline-flex">
									<Icon name="add-knowledge" size={ACTION_ICON_SIZE} />
								</span>
							)}
							{hasProcessingFailed ? "Retry" : "Add to Knowledge Tree"}
						</span>
					</Button>
				</div>
			</div>
		</form>
	);
};

export { ManualTextInput };
