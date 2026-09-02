import { type BaseSyntheticEvent, type JSX, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Button, Input, Textarea } from "~/components/components.js";

const MANUAL_TEXTAREA_ROWS = 8;

type ManualTextInputPayload = {
	content: string;
	title: string;
};

const DEFAULT_MANUAL_TEXT_INPUT_PAYLOAD: ManualTextInputPayload = {
	content: "",
	title: "",
};

type Properties = {
	isLoading?: boolean;
	onCancel: () => void;
	onSubmit: (payload: ManualTextInputPayload) => void;
};

const ManualTextInput = ({
	isLoading = false,
	onCancel,
	onSubmit,
}: Properties): JSX.Element => {
	const {
		control,
		formState: { errors },
		handleSubmit,
	} = useForm<ManualTextInputPayload>({
		defaultValues: DEFAULT_MANUAL_TEXT_INPUT_PAYLOAD,
	});

	const content = useWatch({
		control,
		name: "content",
	});

	const isSubmitDisabled = !content.trim();

	const handleValidSubmit = useCallback(
		(payload: ManualTextInputPayload): void => {
			if (!payload.content.trim()) {
				return;
			}

			onSubmit(payload);
		},
		[onSubmit],
	);

	const handleFormSubmit = useCallback(
		(event: BaseSyntheticEvent): void => {
			void handleSubmit(handleValidSubmit)(event);
		},
		[handleSubmit, handleValidSubmit],
	);

	return (
		<form className="flex min-h-85 flex-col" onSubmit={handleFormSubmit}>
			<div className="flex flex-1 flex-col gap-3 px-6 py-5 max-sm:px-4">
				<Input
					control={control}
					errors={errors}
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
			</div>

			<div className="flex items-center justify-between gap-4 border-t border-border bg-bg px-6 py-4 max-sm:px-4">
				<span
					aria-live="polite"
					className="text-sm text-text-muted max-sm:hidden"
				>
					{isSubmitDisabled ? "No knowledge added yet" : "1 item ready"}
				</span>

				<div className="flex gap-2 max-sm:w-full">
					<Button
						className="max-sm:hidden"
						disabled={isLoading}
						onClick={onCancel}
						variant="ghost"
					>
						Cancel
					</Button>

					<Button
						className="max-sm:w-full"
						disabled={isSubmitDisabled}
						isLoading={isLoading}
						type="submit"
					>
						Add to Knowledge Tree
					</Button>
				</div>
			</div>
		</form>
	);
};

export { ManualTextInput };
