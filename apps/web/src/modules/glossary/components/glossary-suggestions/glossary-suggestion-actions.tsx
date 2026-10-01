import { type GlossaryConsistencyMatchDto } from "@knowledgeprism/types";
import { type JSX, useCallback } from "react";

import { Button } from "~/components/components.js";

type Properties = {
	canAccept?: boolean;
	match: GlossaryConsistencyMatchDto;
	onAccept: (match: GlossaryConsistencyMatchDto) => void;
	onAddToGlossary?: (match: GlossaryConsistencyMatchDto) => void;
	onEdit?: (match: GlossaryConsistencyMatchDto) => void;
	onKeep?: (match: GlossaryConsistencyMatchDto) => void;
};

const GlossarySuggestionActions = ({
	canAccept = true,
	match,
	onAccept,
	onAddToGlossary,
	onEdit,
	onKeep,
}: Properties): JSX.Element => {
	const handleAccept = useCallback(() => {
		onAccept(match);
	}, [match, onAccept]);

	const handleAddToGlossary = useCallback(() => {
		onAddToGlossary?.(match);
	}, [match, onAddToGlossary]);

	const handleEdit = useCallback(() => {
		onEdit?.(match);
	}, [match, onEdit]);

	const handleKeep = useCallback(() => {
		onKeep?.(match);
	}, [match, onKeep]);

	return (
		<div className="flex shrink-0 gap-2">
			{onKeep && (
				<Button
					className="px-3 py-1 text-xs"
					onClick={handleKeep}
					variant="ghost"
				>
					Keep
				</Button>
			)}
			{onEdit && (
				<Button
					className="px-3 py-1 text-xs"
					onClick={handleEdit}
					variant="ghost"
				>
					Edit
				</Button>
			)}
			{onAddToGlossary && (
				<Button
					className="px-3 py-1 text-xs"
					onClick={handleAddToGlossary}
					variant="ghost"
				>
					Add to glossary
				</Button>
			)}
			{canAccept && (
				<Button
					className="px-3 py-1 text-xs"
					onClick={handleAccept}
					variant="secondary"
				>
					Accept
				</Button>
			)}
		</div>
	);
};

export { GlossarySuggestionActions };
