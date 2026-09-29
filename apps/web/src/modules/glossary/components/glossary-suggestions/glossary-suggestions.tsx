import { type GlossaryConsistencyMatchDto } from "@knowledgeprism/types";
import { type JSX } from "react";

import {
	Icon,
	Loader,
	Paragraph,
	ParagraphSize,
} from "~/components/components.js";
import { TextHighlightVariant } from "~/components/knowledge-editor/libs/enums/enums.js";
import { type ValueOf } from "~/lib/types/types.js";

import { GlossarySuggestionActions } from "./glossary-suggestion-actions.js";

const GLOSSARY_ICON_SIZE = 14;
const EMPTY_LENGTH = 0;

const GLOSSARY_SUGGESTIONS_HEADING: Record<
	ValueOf<typeof TextHighlightVariant>,
	string
> = {
	[TextHighlightVariant.SUGGESTION]: "Glossary suggestions",
	[TextHighlightVariant.WARNING]: "Glossary warnings",
};

type GlossarySuggestionRowProperties = {
	canAccept: boolean;
	match: GlossaryConsistencyMatchDto;
	onAccept: (match: GlossaryConsistencyMatchDto) => void;
	onEdit?: (match: GlossaryConsistencyMatchDto) => void;
	onKeep: (match: GlossaryConsistencyMatchDto) => void;
};

const GlossarySuggestionRow = ({
	canAccept,
	match,
	onAccept,
	onEdit,
	onKeep,
}: GlossarySuggestionRowProperties): JSX.Element => {
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

			<GlossarySuggestionActions
				canAccept={canAccept}
				match={match}
				onAccept={onAccept}
				{...(onEdit === undefined ? {} : { onEdit })}
				onKeep={onKeep}
			/>
		</div>
	);
};

type GlossarySuggestionsProperties = {
	canAccept?: boolean;
	isChecking: boolean;
	matches: GlossaryConsistencyMatchDto[];
	onAccept: (match: GlossaryConsistencyMatchDto) => void;
	onEdit?: (match: GlossaryConsistencyMatchDto) => void;
	onKeep: (match: GlossaryConsistencyMatchDto) => void;
	variant: ValueOf<typeof TextHighlightVariant>;
};

const GlossarySuggestions = ({
	canAccept = true,
	isChecking,
	matches,
	onAccept,
	onEdit,
	onKeep,
	variant,
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
				<span>
					{GLOSSARY_SUGGESTIONS_HEADING[variant]} ({matches.length})
				</span>
			</div>

			{matches.map((match) => (
				<GlossarySuggestionRow
					canAccept={canAccept}
					key={`${match.matchedTermId.toString()}-${match.sourceExcerpt}`}
					match={match}
					onAccept={onAccept}
					{...(onEdit === undefined ? {} : { onEdit })}
					onKeep={onKeep}
				/>
			))}
		</div>
	);
};

export { GlossarySuggestions };
