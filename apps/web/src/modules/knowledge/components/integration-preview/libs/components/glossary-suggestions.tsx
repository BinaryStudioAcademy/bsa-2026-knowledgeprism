import { type GlossaryConsistencyMatchDto } from "@knowledgeprism/types";
import { type JSX, useCallback } from "react";

import {
	Button,
	Icon,
	Loader,
	Paragraph,
	ParagraphSize,
} from "~/components/components.js";

const GLOSSARY_ICON_SIZE = 14;
const EMPTY_LENGTH = 0;

type GlossarySuggestionRowProperties = {
	match: GlossaryConsistencyMatchDto;
	onAccept: (match: GlossaryConsistencyMatchDto) => void;
	onEdit: (match: GlossaryConsistencyMatchDto) => void;
	onKeep: (match: GlossaryConsistencyMatchDto) => void;
};

const GlossarySuggestionRow = ({
	match,
	onAccept,
	onEdit,
	onKeep,
}: GlossarySuggestionRowProperties): JSX.Element => {
	const handleAccept = useCallback(() => {
		onAccept(match);
	}, [match, onAccept]);

	const handleEdit = useCallback(() => {
		onEdit(match);
	}, [match, onEdit]);

	const handleKeep = useCallback(() => {
		onKeep(match);
	}, [match, onKeep]);

	return (
		<div className="flex flex-col gap-1.5 rounded-md bg-surface p-2.5 tablet:flex-row tablet:items-center tablet:justify-between">
			<div className="min-w-0 flex-1">
				<Paragraph
					className="text-xs text-text"
					size={ParagraphSize.BODY_SMALL}
				>
					&ldquo;{match.sourceExcerpt}&rdquo; &rarr;{" "}
					<span className="font-medium">{match.suggestedText}</span>
				</Paragraph>
				<Paragraph
					className="text-2xs text-text-faint"
					size={ParagraphSize.BODY_SMALL}
				>
					{match.explanation}
				</Paragraph>
			</div>

			<div className="flex shrink-0 gap-2">
				<Button
					className="px-3 py-1 text-xs"
					onClick={handleKeep}
					variant="ghost"
				>
					Keep
				</Button>
				<Button
					className="px-3 py-1 text-xs"
					onClick={handleEdit}
					variant="ghost"
				>
					Edit
				</Button>
				<Button
					className="px-3 py-1 text-xs"
					onClick={handleAccept}
					variant="secondary"
				>
					Accept
				</Button>
			</div>
		</div>
	);
};

type GlossarySuggestionsProperties = {
	isChecking: boolean;
	matches: GlossaryConsistencyMatchDto[];
	onAccept: (match: GlossaryConsistencyMatchDto) => void;
	onEdit: (match: GlossaryConsistencyMatchDto) => void;
	onKeep: (match: GlossaryConsistencyMatchDto) => void;
};

const GlossarySuggestions = ({
	isChecking,
	matches,
	onAccept,
	onEdit,
	onKeep,
}: GlossarySuggestionsProperties): JSX.Element | null => {
	if (isChecking) {
		return (
			<div className="flex items-center gap-2 rounded-md border border-border-subtle bg-bg px-3 py-2 text-xs text-text-muted">
				<Loader size="sm" />
				<span>Checking against the glossary…</span>
			</div>
		);
	}

	if (matches.length === EMPTY_LENGTH) {
		return null;
	}

	return (
		<div className="flex flex-col gap-2 rounded-md border border-border-subtle bg-bg p-3">
			<div className="flex items-center gap-1.5 text-xs font-medium text-text-muted">
				<Icon name="glossary" size={GLOSSARY_ICON_SIZE} />
				<span>Glossary suggestions ({matches.length})</span>
			</div>

			{matches.map((match) => (
				<GlossarySuggestionRow
					key={`${match.matchedTermId.toString()}-${match.sourceExcerpt}`}
					match={match}
					onAccept={onAccept}
					onEdit={onEdit}
					onKeep={onKeep}
				/>
			))}
		</div>
	);
};

export { GlossarySuggestions };
