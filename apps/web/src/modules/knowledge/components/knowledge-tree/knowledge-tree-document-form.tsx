import { KnowledgeValidationRule } from "@knowledgeprism/constants";
import React, { useCallback, useId, useState } from "react";

import { Button } from "~/components/components.js";

import { EMPTY_LENGTH } from "../../libs/constants/constants.js";

type Properties = {
	isPending: boolean;
	onSubmit: (title: string) => void;
	submitLabel: string;
};

const KnowledgeTreeDocumentForm: React.FC<Properties> = ({
	isPending,
	onSubmit,
	submitLabel,
}: Properties) => {
	const titleId = useId();
	const [title, setTitle] = useState("");
	const trimmedTitle = title.trim();

	const handleSubmit = useCallback(
		(event: React.SubmitEvent<HTMLFormElement>): void => {
			event.preventDefault();

			if (isPending || trimmedTitle.length === EMPTY_LENGTH) {
				return;
			}

			onSubmit(trimmedTitle);
			setTitle("");
		},
		[isPending, onSubmit, trimmedTitle],
	);

	const handleTitleChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>): void => {
			setTitle(event.target.value);
		},
		[],
	);

	return (
		<form className="flex flex-col gap-2.5" onSubmit={handleSubmit}>
			<input
				aria-label="Document title"
				className="block h-9 w-full appearance-none rounded-md border border-border bg-surface px-3 text-sm text-text outline-none transition focus:border-accent focus:ring-3 focus:ring-accent/15"
				disabled={isPending}
				id={titleId}
				maxLength={KnowledgeValidationRule.TITLE_MAXIMUM_LENGTH}
				onChange={handleTitleChange}
				placeholder="Document name"
				type="text"
				value={title}
			/>
			<Button
				disabled={isPending || trimmedTitle.length === EMPTY_LENGTH}
				type="submit"
				variant="secondary"
			>
				{submitLabel}
			</Button>
		</form>
	);
};

export { KnowledgeTreeDocumentForm };
