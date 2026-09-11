import {
	type BaseSyntheticEvent,
	type JSX,
	useCallback,
	useId,
	useRef,
	useState,
} from "react";
import { type Resolver, useForm, useWatch } from "react-hook-form";

import { Alert, Input, Textarea } from "~/components/components.js";

import { KnowledgeInputFooter } from "../knowledge-input-footer.js";

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
	const formId = useId();

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

			<KnowledgeInputFooter
				actionLabel={hasProcessingFailed ? "Retry" : "Add to Knowledge Tree"}
				formId={formId}
				hasActionIcon={!hasProcessingFailed}
				isActionDisabled={!isPayloadReady}
				isLoading={isProcessing}
				onCancel={onCancel}
				statusMessage={statusMessage}
			/>
		</form>
	);
};

export { ManualTextInput };
