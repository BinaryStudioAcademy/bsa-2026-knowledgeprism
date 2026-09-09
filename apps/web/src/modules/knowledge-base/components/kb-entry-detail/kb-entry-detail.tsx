import { useState } from "react";
import { useFormState } from "react-hook-form";

import { Button, Input, Textarea } from "~/components/components.js";
import { useAppForm, useCallback } from "~/hooks/hooks.js";
import {
	KbEntry,
	UpdateKbEntryPayload,
} from "~/modules/knowledge-base/types/kb-types.js";

import { kbEntryValidationSchema } from "./libs/validation-schema.js";

const TEXTAREA_ROWS = 10;

interface KbEntryFormProperties {
	entry: KbEntry;
	onCancel: () => void;
	onSave: (payload: UpdateKbEntryPayload) => Promise<void>;
}

const KbEntryForm = ({ entry, onCancel, onSave }: KbEntryFormProperties) => {
	const { control, handleSubmit } = useAppForm<UpdateKbEntryPayload>({
		defaultValues: {
			content: entry.content,
			title: entry.title,
		},
		mode: "onChange",
		validationSchema: kbEntryValidationSchema,
	});

	const { isValid } = useFormState({ control });

	const handleValidSubmit = useCallback(
		async (values: UpdateKbEntryPayload): Promise<void> => {
			await onSave(values);
			onCancel();
		},
		[onCancel, onSave],
	);

	const handleFormSubmit = useCallback(
		(event_: React.BaseSyntheticEvent): void => {
			void handleSubmit(handleValidSubmit)(event_);
		},
		[handleSubmit, handleValidSubmit],
	);

	return (
		<form className="flex flex-col gap-4" onSubmit={handleFormSubmit}>
			<div className="kb-header flex justify-end gap-2 pb-4">
				<Button onClick={onCancel} type="button" variant="ghost">
					Cancel
				</Button>
				<Button disabled={!isValid} type="submit">
					Save
				</Button>
			</div>

			<div className="kb-body flex flex-col gap-4">
				<Input
					control={control}
					label="Event or club name"
					name="title"
					placeholder="Enter name..."
				/>
				<Textarea
					control={control}
					label="Description"
					name="content"
					placeholder="Describe the program, schedule, and participation terms..."
					rows={TEXTAREA_ROWS}
				/>
			</div>
		</form>
	);
};

interface KbEntryDetailProperties {
	canEdit: boolean;
	entry: KbEntry;
	onSave: (payload: UpdateKbEntryPayload) => Promise<void>;
}

const KbEntryDetail = ({ canEdit, entry, onSave }: KbEntryDetailProperties) => {
	const [isEditing, setIsEditing] = useState(false);

	const handleCancel = useCallback(() => {
		setIsEditing(false);
	}, []);

	const handleStartEdit = useCallback(() => {
		setIsEditing(true);
	}, []);

	return (
		<div className="kb-container">
			{isEditing ? (
				<KbEntryForm entry={entry} onCancel={handleCancel} onSave={onSave} />
			) : (
				<>
					{canEdit && (
						<div className="kb-header flex justify-end pb-4">
							<Button onClick={handleStartEdit} type="button">
								Edit
							</Button>
						</div>
					)}
					<div className="kb-body">
						<h1 className="mb-4 text-2xl font-bold">{entry.title}</h1>
						<p className="whitespace-pre-wrap">{entry.content}</p>
					</div>
				</>
			)}
		</div>
	);
};

export { KbEntryDetail };
